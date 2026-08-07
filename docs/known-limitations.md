# Known Limitations

Security and design limitations that are recorded but not yet resolved.
Each entry notes the finding ID from `db-audit.md`, the nature of the limitation, and the proper long-term fix.

---

## Security

### NULL-CALLER CLASS — PL/pgSQL `NOT IN` fails open when role is NULL

Any SECURITY DEFINER RPC that does `IF v_role NOT IN ('admin', 'superadmin')` without an explicit `IS NULL` check fails open when the caller's UUID is null or not found in `app_users`. `NULL NOT IN (...)` evaluates to `UNKNOWN` in SQL; PL/pgSQL treats `IF UNKNOWN` as `FALSE`; the `RAISE EXCEPTION` is skipped; the function proceeds.

**Full RPC audit (2026-08-06):**

| RPC | Null-caller result |
|---|---|
| `verify_login(text, text)` | FAIL-CLOSED — `NOT FOUND` pattern, no bypass |
| `change_own_password(uuid, text, text)` | FAIL-CLOSED — `NOT FOUND` pattern |
| `run_daily_absent_marking(uuid)` | was FAIL-OPEN, patched with `IS NULL OR NOT IN` |
| `reset_user_password(uuid, uuid, text, bool)` | was FAIL-OPEN, patched with `IS NULL OR NOT IN` |
| `get_payments(uuid)` | FAIL-CLOSED — built with `IS NULL OR NOT IN` from the start |
| `create_payment(uuid,...)` | FAIL-CLOSED — built with `IS NULL OR NOT IN` from the start |
| `record_scan(uuid)` | N/A — no privilege guard |
| `get_receipt_by_id(uuid)` | N/A — intentionally public |

**Rule for all future RPCs with privilege guards:**
```sql
-- Always write:
IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
  RAISE EXCEPTION 'Unauthorized';
END IF;
-- Never write just:
IF v_role NOT IN ('admin', 'superadmin') THEN ...
```

---

### H1-SOFT — `run_daily_absent_marking` caller check is asserted, not verified

**Finding:** H1 (High)

The `run_daily_absent_marking(p_caller_id uuid)` RPC verifies that the supplied UUID belongs to an admin or superadmin in `app_users` before running. This blocks teachers and anonymous callers.

**Limitation:** `p_caller_id` is passed by the client. Anyone who already holds a valid admin UUID (readable via the `anon_read_app_users` policy) could supply it and pass the check without actually being logged in as that admin.

**Current protection level:** Blocks casual and automated abuse. Does not block a targeted attacker with knowledge of an admin UUID.

**Proper fix:** C3 — migrate to Supabase Auth so `auth.uid()` is set server-side and cannot be spoofed by the caller. The `branch_*` RLS policies are already written for this and would activate immediately on migration.

---

## Dead Code

### M2-UX — `reset_user_password` silently no-ops on unauthorized target

`reset_user_password` enforces privilege tiering via the `WHERE` clause: admin can only reset teachers (`WHERE role = 'teacher'`), superadmin can reset anyone except superadmins (`WHERE role != 'superadmin'`). If the target doesn't match (e.g. admin targets another admin, anyone targets a superadmin), `UPDATE` affects zero rows and the function returns `void` with no error.

**Security posture:** Fail-closed — the unauthorized reset does not happen.

**UX problem:** The caller receives a success response. The UI shows no error. The admin believes the password was reset; it was not. The affected user continues using their old password, unaware.

**Proper fix:** After each UPDATE, check `GET DIAGNOSTICS v_count = ROW_COUNT` and `RAISE EXCEPTION 'Target user not found or not in permitted role'` if `v_count = 0`. Not blocking current work — record for the next DB maintenance pass.

---

### DEAD-1 — `markAllAbsent` / `runManualAttendance` never wired up

`dashboard.service.js → markAllAbsent(callerId)` is called only by `useDashboard.js → runManualAttendance()`, which is returned from the hook but never consumed by any component. No button or UI surface calls it.

**Effect:** The dashboard has no "Mark & Notify" button. The only live path for absent marking is the scanner page admin button (`AdminScannerControls → runNow → runAbsentMarking`).

**Decision needed:** Either wire `runManualAttendance` to a button on the dashboard (with appropriate role guard), or remove both `markAllAbsent` and `runManualAttendance` to reduce dead surface area. Do not act without confirming intended dashboard behaviour.
