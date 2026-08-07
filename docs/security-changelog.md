# Security Changelog

Records of security fixes applied to the live Supabase project (`rykxrnhwvvlwlxdzjyub`).
Each entry includes the original state (for rollback) and what was changed.

---

## 2026-08-06

### C1 — `reset_user_password` authorization check added

**Problem:** RPC was SECURITY DEFINER with no caller check — any anon caller could reset any user's password including superadmin.

**Fix:** Replaced with a 4-arg version `(p_caller_id uuid, p_user_id uuid, p_new_password text, p_must_change boolean DEFAULT true)` that verifies the caller's role before updating. Admin can only reset teachers; superadmin can reset admins and teachers.

**JS change:** `adminResetPassword(callerId, userId, newPassword)` — added `callerId` param, passes `p_caller_id` to RPC.

**C1 follow-up (null-caller patch):** The initial C1 fix used `IF v_caller_role NOT IN ('admin', 'superadmin')` without an `IS NULL` guard. `NULL NOT IN (...)` = UNKNOWN → PL/pgSQL skips the RAISE → null caller could still reset any password. Fixed by adding `IS NULL OR` to the check. See `/tmp/c1_null_caller_patch.sql` for apply instructions (requires `pg_get_functiondef` to get live body first).

---

### C2 — Passwords hashed with bcrypt

**Problem:** All passwords stored as plaintext in `app_users.password`. `anon_read_app_users` policy exposed them to any unauthenticated caller.

**Fix:**
- `pgcrypto.crypt(password, gen_salt('bf', 10))` applied to all rows via `UPDATE app_users SET password = crypt(password, gen_salt('bf', 10))`. All 6 rows migrated. Zero plaintext rows remain.
- New `verify_login(p_username text, p_password text)` RPC (SECURITY DEFINER) does bcrypt comparison server-side and returns the user JSON (without password field) or NULL.
- `change_own_password(p_user_id uuid, p_current_password text, p_new_password text)` verifies current password via `crypt()` before updating.

**JS change:** `loginWithCredentials` switched from `.from('app_users').eq('password', ...)` to `.rpc('verify_login', ...)`. `changeOwnPassword` signature updated to 3 args including current password.

**Rollback:** `attendance-backup-20260806.dump` was taken before C2 but has been permanently deleted (2026-08-07) — it contained plaintext passwords and was in an iCloud-synced path. No rollback to plaintext is possible or desirable.

---

### change_own_password — ownership verification added

**Problem:** Previous version only verified user existed, not that caller knew the current password — same hole as C1 for self-service changes.

**Fix:** `change_own_password` now requires `p_current_password`, verified against stored bcrypt hash inside the function before updating.

---

### M2 — Stale 2-arg `reset_user_password` overload

**Status:** Already absent from DB at time of audit resolution. Only the 4-arg version (C1 fix) exists. No action required.

---

### H1 — `run_daily_absent_marking` caller authorization added

**Problem:** No-arg RPC with no auth check — any caller could mass-mark all students across all branches as absent.

**Fix:** Replaced with `run_daily_absent_marking(p_caller_id uuid)` (SECURITY DEFINER). Verifies caller is `admin` or `superadmin` in `app_users` before running. Old no-arg version dropped.

**Limitation (recorded in known-limitations.md):** `p_caller_id` is caller-asserted. Proper fix requires C3 (Supabase Auth migration).

**JS change:** `markAllAbsent(callerId)` and `runAbsentMarking(callerId)` updated to pass `session.id` as `p_caller_id`.

---

### H2 — `anon_delete_students` policy dropped

**Problem:** RLS policy allowed any anon caller to hard-delete any student record with no row filter.

**Original policy (for rollback):**
```
policyname:  anon_delete_students
cmd:         DELETE
qual:        true
with_check:  null
```
Rollback: `CREATE POLICY "anon_delete_students" ON public.students FOR DELETE TO anon USING (true);`
(Do not restore unless you have a specific reason — this policy should not exist.)

**Fix:** `DROP POLICY IF EXISTS "anon_delete_students" ON public.students;`

**JS change:** None. App uses soft-delete only (`update({ is_active: false })`). No app path calls hard delete on students.

---

### H3 — payments locked behind SECURITY DEFINER RPCs

**Problem:** `anon_all_payments` policy granted SELECT, INSERT, UPDATE, and DELETE to anon with no row filter — any caller could read, modify, or delete any payment record. `generate_receipt_no` was also directly callable by anon.

**Original policy (for rollback):**
```
policyname:  anon_all_payments
cmd:         ALL
qual:        true
with_check:  true
```
Rollback: `CREATE POLICY "anon_all_payments" ON public.payments FOR ALL TO anon USING (true) WITH CHECK (true);`

**Fix:** Dropped all anon RLS policies on `payments`. Replaced with three SECURITY DEFINER RPCs:
- `get_payments(p_caller_id uuid)` — admin/superadmin only, returns all payments with student+branch join
- `get_receipt_by_id(p_id uuid)` — intentionally public (shareable parent link), scoped fields only
- `create_payment(p_caller_id uuid, ...)` — admin/superadmin only, generates `receipt_no` internally

Auth check in both guarded RPCs: `IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN RAISE EXCEPTION 'Unauthorized'` — the `IS NULL` guard is critical; without it `NULL NOT IN (...)` evaluates to UNKNOWN and PL/pgSQL skips the RAISE (fails open).

`generate_receipt_no` EXECUTE revoked from anon — now called internally by `create_payment` only.

**SQL applied:** `/tmp/h3_payments_rpcs.sql`

**JS changes:**
- `src/lib/supabase.js`: `getPayments(callerId)` and `createPayment({callerId,...})` now call RPCs; dead `importStudentsCSV` removed
- `src/lib/services/receipts.service.js`: `getReceiptById` uses `rpc('get_receipt_by_id',...)`
- `src/lib/services/importer.service.js`: `importStudentsCSV(rows, callerId)` threads `callerId` to `createPayment`
- `src/hooks/useFees.js`: passes `session?.id` to `getPayments` and both `createPayment` calls
- `src/hooks/useManualReceipt.js`: passes `session?.id` to `createPayment`
- `src/components/features/importer/ImporterPage.jsx`: accepts `session` prop, passes `session?.id` to `importStudentsCSV`
- `src/App.jsx`: `<Importer session={session} />`

**Note:** H1 (`run_daily_absent_marking`) has the same null-caller fail-open bug. Patch: see `/tmp/h1_null_caller_patch.sql` — replace `IF v_role NOT IN (...)` with `IF v_role IS NULL OR v_role NOT IN (...)` in the live function.

---

### H5 — `notify_absent_parents` edge function authorization added

**Problem:** Edge function accepted any HTTP request with no auth check. Used service role key internally (bypasses all RLS). Any caller who knew the URL could trigger mass Telegram notifications to all parents of absent students.

**Why shared secret was ruled out:** Both callers (`dashboard.service.js`, `attendance.service.js`) are frontend code — any secret bundled in `VITE_*` env or JS would be readable from DevTools, providing no security over the open URL.

**Fix:** Edge function now reads `caller_id` from the POST body, rejects null immediately (401), then verifies role against `app_users` using the service role client. Only `admin` and `superadmin` proceed.

**JS changes:**
- `src/lib/services/dashboard.service.js`: `markAbsentForEvent(todayEvent, callerId)` — passes `caller_id` in POST body
- `src/lib/services/attendance.service.js`: `runAbsentMarking(callerId)` — passes `caller_id` in `functions.invoke` body
- `src/hooks/useDashboard.js`: `markAbsentForEvent(todayEvent, session?.id)`

**Verified 2026-08-07:** `{}` body → HTTP 401 `{"error":"Unauthorized"}`; valid admin UUID → HTTP 200 `{"notified":0}` (no absent records, zero messages sent).
