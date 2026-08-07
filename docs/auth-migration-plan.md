# Supabase Auth Migration Plan — C3 (revised)

**Project:** `rykxrnhwvvlwlxdzjyub`  
**Live URL:** `https://nimonimo.tech/cpcc` (VPS at `76.13.216.126`, static files at `/var/www/html/`)  
**Status:** PLAN ONLY — no code or SQL to be executed until reviewed and approved step by step.

---

## Reference Audit — Every Column Holding a User UUID

Completed before writing this plan. Full results:

| Table | Column | FK target | Current state | Migration impact |
|---|---|---|---|---|
| `user_branch_roles` | `user_id` | `auth.users(id)` ON DELETE CASCADE | Populated with `app_users.id` values — rows exist but FK is unsatisfied (no matching `auth.users` rows) | **Zero updates needed if UUIDs preserved** |
| `attendance` | `scanned_by` | `auth.users(id)` | All NULL — `auth.uid()` was always null | Nothing to update |
| `classes` | `teacher_id` | `auth.users(id)` | All NULL — never assigned in app | Nothing to update |
| `holidays` | `approved_by` | `auth.users(id)` | All NULL — never set in app | Nothing to update |
| `payments` | `issued_by` | None (varchar, soft ref) | Plain text: `'Admin'`, `'Import'`, teacher name | Not a UUID — zero orphan risk |
| `app_users` | `id` | Referenced by nothing | Source table — zero FKs point at it | No cascade concerns |

**Key finding:** `user_branch_roles.user_id` already has a hard FK to `auth.users(id)`, not `app_users(id)`. The schema was always designed for Supabase Auth. `app_users.id` values are in `user_branch_roles` as forward references — the `auth.users` rows just don't exist yet to satisfy the FK.

---

## Chosen Approach: Preserve Existing UUIDs

**Why:** Creating `auth.users` rows with the same UUIDs as the existing `app_users` rows requires zero reference updates. `user_branch_roles` already holds the right UUIDs. `attendance.scanned_by`, `classes.teacher_id`, and `holidays.approved_by` are all NULL and will populate correctly once `auth.uid()` is non-null. No orphan risk anywhere.

**How:** Use the Supabase SQL editor to INSERT directly into `auth.users` with an explicit `id`. The Management API also supports this via the `id` field in the create-user body, but the SQL editor is simpler and avoids CLI/token issues.

**Alternative considered and rejected:** Create new auth users (new UUIDs) then UPDATE all references. Rejected because: (a) more operations, (b) more orphan risk, (c) the FK on `user_branch_roles` would need to be temporarily deferred or the UPDATE must happen in the exact right order.

---

## 1. Synthetic Email Construction

**Rule:** `<username>@cpcc.internal`

`cpcc.internal` is a reserved internal label, not a real domain. No email is ever sent to it. Supabase Auth uses it as the identity key; users never see or type it.

**Where constructed:** Only in `src/lib/services/users.service.js` → `loginWithCredentials`, immediately before calling `supabase.auth.signInWithPassword`. One place, one line.

**UI:** Unchanged. Login form accepts username only. `@cpcc.internal` is appended in code, never shown.

---

## 2. Creating `auth.users` Rows (Preserving UUIDs)

Six users. For each, run in the SQL editor:

```sql
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
)
VALUES (
  '<existing app_users.id>',
  '<username>@cpcc.internal',
  crypt('<temp_password>', gen_salt('bf')),
  NOW(),
  jsonb_build_object(
    'role',                '<role>',
    'branch_id',           '<branch_id or null>',
    'must_change_password', true
  ),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);
```

Do all 6 in one transaction. The values to fill in:

| username | id (from app_users) | role | branch_id |
|---|---|---|---|
| superadmin | `SELECT id FROM app_users WHERE username='superadmin'` | superadmin | null |
| admin | `SELECT id FROM app_users WHERE username='admin'` | admin | `SELECT branch_id FROM app_users WHERE username='admin'` |
| klts | `SELECT id FROM app_users WHERE username='klts'` | teacher | `SELECT branch_id FROM app_users WHERE username='klts'` |
| sntl | `SELECT id FROM app_users WHERE username='sntl'` | teacher | `SELECT branch_id FROM app_users WHERE username='sntl'` |
| wgmj | `SELECT id FROM app_users WHERE username='wgmj'` | teacher | `SELECT branch_id FROM app_users WHERE username='wgmj'` |
| mxim | `SELECT id FROM app_users WHERE username='mxim'` | teacher | `SELECT branch_id FROM app_users WHERE username='mxim'` |

**Temp password:** Choose one before starting. All 6 users get the same temp password — they must change it on first login. Do not store it after the migration is complete.

**Note on `encrypted_password`:** Supabase Auth uses bcrypt internally. `crypt('<temp_password>', gen_salt('bf'))` produces the correct format. This is identical to how the `app_users` passwords were hashed.

---

## 3. Populating `user_branch_roles`

**Context:** `user_branch_roles` currently has exactly 1 stale orphaned row (a UUID that no longer exists in `app_users`). None of the 6 live users have rows here. This step inserts all 6 rows after the `auth.users` rows exist (the FK requires `auth.users.id` to exist first).

**Role mapping (Option B — confirmed safe after blast-radius audit):**

| app_users.role | user_branch_roles.role | Reason |
|---|---|---|
| `superadmin` | `super_admin` | Direct mapping — `is_super_admin()` returns true |
| `admin` | `super_admin` | Admin has `branch_id = null`, so `get_my_branch_ids()` returns `[]`. Giving admin `super_admin` in `user_branch_roles` makes `is_super_admin()` return true, giving cross-branch read access — which is what admin already has. All privilege-tiering between admin and superadmin is enforced via `app_users.role` (read from session or SQL), not from `user_branch_roles.role`. |
| `teacher` | `teacher` | Direct mapping |

Run in SQL editor, after the 6 `auth.users` rows are created:

```sql
-- Remove stale orphaned row (user_id not in auth.users)
DELETE FROM public.user_branch_roles
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- superadmin → super_admin, no branch
INSERT INTO public.user_branch_roles (user_id, role, branch_id)
SELECT id, 'super_admin', NULL
FROM public.app_users WHERE username = 'superadmin';

-- admin → super_admin, no branch (Option B)
INSERT INTO public.user_branch_roles (user_id, role, branch_id)
SELECT id, 'super_admin', NULL
FROM public.app_users WHERE username = 'admin';

-- teachers → teacher, scoped to their branch
INSERT INTO public.user_branch_roles (user_id, role, branch_id)
SELECT id, 'teacher', branch_id
FROM public.app_users WHERE role = 'teacher';
```

Rollback: `DELETE FROM public.user_branch_roles WHERE user_id IN (SELECT id FROM public.app_users);`

---

## 4. Verification Query — GATE, Must Pass Before Any JS Change

Run this after both §2 (auth.users) and §3 (user_branch_roles) are complete:

```sql
SELECT
  u.username,
  u.role                              AS app_role,
  u.id                                AS app_users_id,
  au.id                               AS auth_id,
  au.email                            AS auth_email,
  au.raw_user_meta_data->>'role'      AS meta_role,
  ubr.role                            AS ubr_role,
  ubr.branch_id                       AS ubr_branch_id,
  b.name                              AS branch_name,
  CASE
    WHEN au.id IS NULL
      THEN 'FAIL: no auth.users row'
    WHEN au.id != u.id
      THEN 'FAIL: UUID mismatch'
    WHEN au.email != u.username || '@cpcc.internal'
      THEN 'FAIL: wrong email'
    WHEN ubr.user_id IS NULL
      THEN 'FAIL: no user_branch_roles row'
    WHEN u.role IN ('admin', 'superadmin') AND ubr.role != 'super_admin'
      THEN 'FAIL: admin/superadmin must map to super_admin in ubr'
    WHEN u.role = 'teacher' AND ubr.role != 'teacher'
      THEN 'FAIL: teacher must map to teacher in ubr'
    WHEN u.role = 'teacher' AND ubr.branch_id IS DISTINCT FROM u.branch_id
      THEN 'FAIL: teacher branch mismatch'
    ELSE 'OK'
  END                                 AS status
FROM public.app_users u
LEFT JOIN auth.users au             ON au.id = u.id
LEFT JOIN public.user_branch_roles ubr ON ubr.user_id = u.id
LEFT JOIN public.branches b         ON b.id = ubr.branch_id
ORDER BY u.role, u.username;
```

**Expected:** 6 rows, every `status = 'OK'`.

- `no auth.users row` → the §2 INSERT failed for this user — re-run it
- `UUID mismatch` → wrong id value used in the INSERT — delete and re-insert with the correct UUID
- `no user_branch_roles row` → the §3 INSERT failed — re-run it
- `wrong ubr role` → stale row with wrong role — delete and re-run §3 for that user
- `teacher branch mismatch` → `user_branch_roles.branch_id` doesn't match `app_users.branch_id` — delete and re-run §3

**Do not proceed to Step 5 (JS changes) until all rows show OK.**

---

## 5. Login Flow Rewrite

### Current
```
LoginForm → loginWithCredentials(username, password)
  → supabase.rpc('verify_login', { p_username, p_password })
  → returns user JSON or null
  → setSession(user, teacherName) → localStorage
```

### New
```
LoginForm → loginWithCredentials(username, password)   [UI unchanged]
  → email = username.toLowerCase().trim() + '@cpcc.internal'
  → supabase.auth.signInWithPassword({ email, password })
  → on success: user_metadata has { role, branch_id, must_change_password }
  → setSession(user_metadata + username, teacherName) → localStorage
  → Supabase Auth JWT is now set on the supabase client automatically
```

### must_change_password first-login path
After `signInWithPassword` succeeds: check `user.user_metadata.must_change_password`. If true → `ChangePasswordForm` shows (same as now). On successful change:
- `supabase.auth.updateUser({ password: newPassword })`
- `supabase.auth.updateUser({ data: { must_change_password: false } })`

The `change_own_password` RPC is retired — no current-password verification is needed because the user must already be authenticated to reach this screen.

### Logout
`supabase.auth.signOut()` runs alongside `clearSession()`. Both required.

### Session expiry
Supabase Auth JWT handles expiry server-side. The manual midnight timer in `App.jsx` can be removed. Keep the `getSession()` check on load for localStorage state.

---

## 6. Files Switching to Authenticated Client

No import changes. The same `supabase` singleton in `src/lib/supabase.js` carries the JWT after `signInWithPassword`. `auth.uid()` becomes non-null automatically for every subsequent call.

Tables whose access becomes scoped by `branch_*` RLS once authenticated:

| File | Tables | What changes |
|---|---|---|
| `attendance.service.js` | `students`, `attendance`, `branches` | Branch scoping enforced by DB, not JS `.eq('branch_id', ...)` |
| `dashboard.service.js` | `attendance`, `branches` | `branch_attendance` policy active |
| `students.service.js` | `students`, `attendance`, `parents`, `branches` | `branch_students` policy active |
| `holidays.service.js` | `holidays`, `school_calendar` | `branch_holidays`, `manage_calendar` active |
| `events.service.js` | `events` | `anon_all_events` still exists until cleanup |
| `users.service.js` | `app_users` | Still reads `app_users` for manage-users — `anon_read_app_users` must stay until `app_users` access is restricted post-cleanup |
| `supabase.js` helpers | `branches`, `students`, `attendance`, `payments` | RLS active |

**Important:** The `branch_*` policies use `get_my_branch_ids()` which checks `user_branch_roles`. Superadmin uses `is_super_admin()`. Both now return correct values once `auth.uid()` is non-null.

---

## 7. Per-RPC Recommendation After Migration

### `get_payments(p_caller_id uuid)` → **Keep, replace param with `auth.uid()`**
Payments need a SECURITY DEFINER function (cross-branch read for admin/superadmin; `branch_*` RLS would block superadmin seeing all branches). Replace `WHERE id = p_caller_id` with `WHERE id = auth.uid()`. Drop `p_caller_id` param. JS drops `callerId` arg.

### `create_payment(p_caller_id uuid, ...)` → **Keep, replace param with `auth.uid()`**
Same reasoning — cross-branch operation, receipt_no generation needs SECURITY DEFINER context. Drop `p_caller_id`. JS drops `callerId` arg.

### `reset_user_password(p_caller_id uuid, ...)` → **Rewrite: target `auth.users`, not `app_users.password`**

**Critical post-migration change:** after migration, `loginWithCredentials` authenticates via `supabase.auth.signInWithPassword`, which reads `auth.users.encrypted_password`. The current RPC updates `app_users.password` (bcrypt via pgcrypto) — after migration that column is no longer consulted at login. An admin reset would silently succeed but the user could never log in with the new password.

**Required behaviour (confirmed):** admin/superadmin resets a user to a temp password and tells them manually. No email (synthetic addresses). User is forced to change on first login (`must_change_password = true` in both `auth.users.raw_user_meta_data` and `app_users.must_change_password`).

**Implementation decision for Checkpoint 7:** two options —
- **Option A (SQL):** SECURITY DEFINER function runs as postgres superuser; UPDATE `auth.users SET encrypted_password = crypt(p_new_password, gen_salt('bf'))` directly. Postgres superuser can cross-schema write. Same bcrypt format Supabase Auth reads. Simpler, no HTTP call.
- **Option B (Edge Function):** new edge function calls Supabase Admin API `updateUserById()`. Correct per Supabase model but adds a network hop and deployment step.

Decide and implement at Checkpoint 7. Authorization tiering (admin resets teachers only, superadmin resets anyone) and M2-UX row-count fix are unchanged — both still read from `app_users.role`.

Also update `app_users.must_change_password = true` in the same operation so next login (pre-auth app_users query) shows the force-change screen.

### `run_daily_absent_marking(p_caller_id uuid)` → **Keep, replace param with `auth.uid()`**
Cross-branch write. Keep SECURITY DEFINER. Drop `p_caller_id`. JS drops `callerId` arg.

### `change_own_password(uuid, text, text)` → **DROP**
Replaced by `supabase.auth.updateUser({ password })`. Supabase Auth handles current-password verification via the active session — no RPC needed. Drop both overloads.

### `verify_login(text, text)` → **DROP**
Replaced by `supabase.auth.signInWithPassword`. Drop it.

### `record_scan(p_student_id uuid)` → **Modify: add branch check, `auth.uid()` for `scanned_by`**
Keep SECURITY DEFINER (cross-table write). `scanned_by` now records `auth.uid()` correctly (was always null before). Add M1 branch check: if caller is a teacher (`role != 'super_admin'` in `user_branch_roles`), verify `v_student.branch_id = (SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid())`. M1 closes here at no extra cost.

### `notify_absent_parents` edge function → **Replace body `caller_id` with JWT verification**
Edge function currently trusts `caller_id` from the POST body. After migration, replace with:
```typescript
const { data: { user } } = await supabase.auth.getUser(
  req.headers.get('Authorization')?.replace('Bearer ', '')
)
```
Then verify `user.user_metadata.role` is `admin` or `superadmin`. JS callers stop passing `caller_id` — `supabase.functions.invoke` sends the JWT header automatically. H5-SOFT closes here.

---

## 8. Supabase Auth Config for Live Deployment

### In Supabase Dashboard → Authentication → URL Configuration

**Site URL:**
```
https://nimonimo.tech
```
(The origin, not the subpath. Supabase uses this as the OAuth base.)

**Redirect URLs (add all):**
```
https://nimonimo.tech/cpcc
https://nimonimo.tech/cpcc/
http://localhost:3000/cpcc
http://localhost:3000/cpcc/
```

### VPS / deploy.sh
No changes. Static SPA — `vite build` bakes `/cpcc/` base path from `vite.config.js`. nginx or the static server does not need to change. The Supabase client URL and anon key remain hardcoded in `src/lib/supabase.js`.

**One nginx check:** Confirm the server has `try_files $uri /cpcc/index.html` (or equivalent) for SPA routing. If deep links work today on the live site, it's already correct.

---

## 9. Strict Order of Operations

---

**BACKUP CHECKPOINT** — Take a fresh `pg_dump` before Step 1 if the last backup is more than a day old.

```bash
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
pg_dump "postgresql://postgres.rykxrnhwvvlwlxdzjyub:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres" \
  --no-owner --no-acl -Fc \
  -f ~/backups-local/attendance-backup-$(date +%Y%m%d)-premigration.dump
```

---

**Step 1 — Supabase Auth URL config** ✦ REVERSIBLE  
Dashboard → Authentication → URL Configuration. Set Site URL and Redirect URLs as in §8.  
Rollback: revert the fields.

**Step 2 — Get the 6 UUIDs and branch_ids from `app_users`** ✦ READ-ONLY  
Run in SQL editor, save the output:
```sql
SELECT id, username, role, branch_id FROM app_users ORDER BY role, username;
```
You will need these values to fill in Step 3.

**Step 3 — Create 6 `auth.users` rows with preserved UUIDs** ✦ REVERSIBLE  
Run the INSERT block from §2 in the SQL editor for all 6 users in one transaction.  
Rollback: `DELETE FROM auth.users WHERE email LIKE '%@cpcc.internal';`

**Step 4 — Populate `user_branch_roles`** ✦ REVERSIBLE  
Run the SQL from §3 (Populating `user_branch_roles`) in the SQL editor: delete the stale orphaned row, then insert all 6 users with the correct role mapping (admin → `super_admin`, teachers → `teacher`).  
Rollback: `DELETE FROM public.user_branch_roles WHERE user_id IN (SELECT id FROM public.app_users);`

**Step 5 — Run Verification Query (§4 — Verification Query)** ✦ GATE  
All 6 rows must show `status = 'OK'`. Fix any failures before continuing. Do not proceed to Step 6 with any FAIL row.

**Step 6 — Deploy JS changes** ✦ REVERSIBLE (git revert)  
Files to change (in order, one commit):
1. `src/lib/services/users.service.js` — rewrite `loginWithCredentials`, remove `changeOwnPassword`, rewrite `adminResetPassword` (drop `callerId`)
2. `src/lib/auth.js` — add `supabase.auth.signOut()` to `clearSession`, remove midnight timer logic
3. `src/App.jsx` — add Supabase Auth session listener (`supabase.auth.onAuthStateChange`), remove midnight timer
4. `src/components/features/auth/ChangePasswordForm.jsx` — switch to `supabase.auth.updateUser`
5. `src/hooks/useFees.js`, `src/hooks/useManualReceipt.js`, `src/hooks/useAttendance.js`, `src/hooks/useDashboard.js` — remove `callerId` args from RPC calls
6. `src/lib/services/importer.service.js`, `src/lib/services/attendance.service.js`, `src/lib/services/dashboard.service.js` — remove `callerId` threading
7. `supabase/functions/notify_absent_parents/index.ts` — switch to JWT verification

Build and deploy: `npm run build && ./deploy.sh`  
Rollback: `git revert <commit>` → rebuild → redeploy.

**Step 7 — Redeploy updated RPCs** ✦ REVERSIBLE  
For each RPC: `CREATE OR REPLACE FUNCTION` replacing `p_caller_id` with `auth.uid()`.  
Functions: `get_payments`, `create_payment`, `reset_user_password`, `run_daily_absent_marking`, `record_scan` (add branch check).  
Redeploy edge function: `supabase functions deploy notify_absent_parents --project-ref rykxrnhwvvlwlxdzjyub`  
Rollback: `CREATE OR REPLACE FUNCTION` reverting to `p_caller_id` versions (bodies in `docs/security-changelog.md`).

**Step 8 — Smoke test on live** ✦ GATE  
Test each role on the live site (`https://nimonimo.tech/cpcc`):
- Log in as each of the 4 roles with the temp password → must-change screen appears
- Change password → reach scanner
- Admin: verify `/fees` and manage-users show **all branches** (Option B — admin is `super_admin` in `user_branch_roles`)
- Teacher (klts): verify scanner and student list show only KLTS students
- Teacher: attempt to scan a student from another branch → expect rejection (M1 closed)
- Superadmin: verify `/fees` and manage-users show all branches
- Open `/receipt/<any-id>` in incognito → receipt loads (public path still works)

If any check fails: `git revert` Step 6, redeploy, revert Step 7 RPCs. `auth.users` rows and `user_branch_roles` are unaffected — old code still works.

**Step 9 — Cleanup (§10)** ✦ DESTRUCTIVE  
Only after Step 8 passes fully. Separate section below.

---

## 10. Cleanup — Run Only After Step 8 Passes

**DROP RPCs no longer needed:**
```sql
DROP FUNCTION IF EXISTS public.verify_login(text, text);
DROP FUNCTION IF EXISTS public.change_own_password(uuid, text, text);
DROP FUNCTION IF EXISTS public.change_own_password(uuid, text);
```

**DROP `password` column from `app_users`:**
```sql
ALTER TABLE public.app_users DROP COLUMN password;
```

**DROP all `anon_*` RLS policies** (full list from audit):
```sql
DROP POLICY IF EXISTS "allow anon update password"        ON public.app_users;
DROP POLICY IF EXISTS "anon_read_app_users"               ON public.app_users;
DROP POLICY IF EXISTS "anon_read_attendance"              ON public.attendance;
DROP POLICY IF EXISTS "anon_insert_attendance"            ON public.attendance;
DROP POLICY IF EXISTS "anon_update_attendance"            ON public.attendance;
DROP POLICY IF EXISTS "anon_read_students"                ON public.students;
DROP POLICY IF EXISTS "anon_insert_students"              ON public.students;
DROP POLICY IF EXISTS "anon_update_students"              ON public.students;
DROP POLICY IF EXISTS "anon_delete_students"              ON public.students;
DROP POLICY IF EXISTS "anon_all_events"                   ON public.events;
DROP POLICY IF EXISTS "anon_delete_holidays"              ON public.holidays;
DROP POLICY IF EXISTS "anon_insert_holidays"              ON public.holidays;
DROP POLICY IF EXISTS "anon_read_holidays"                ON public.holidays;
DROP POLICY IF EXISTS "anon_insert_parents"               ON public.parents;
DROP POLICY IF EXISTS "anon_read_parents"                 ON public.parents;
DROP POLICY IF EXISTS "anon_delete_school_calendar"       ON public.school_calendar;
DROP POLICY IF EXISTS "anon_insert_school_calendar"       ON public.school_calendar;
DROP POLICY IF EXISTS "anon_read_school_calendar"         ON public.school_calendar;
```

**Revoke EXECUTE from anon** on all RPCs except `get_receipt_by_id`:
```sql
REVOKE EXECUTE ON FUNCTION public.verify_login(text, text)                                                               FROM anon;
REVOKE EXECUTE ON FUNCTION public.change_own_password(uuid, text, text)                                                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_user_password(uuid, uuid, text, boolean)                                         FROM anon;
REVOKE EXECUTE ON FUNCTION public.run_daily_absent_marking(uuid)                                                         FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_payments(uuid)                                                                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_payment(uuid, uuid, uuid, numeric, text, integer, date, text, text, text)       FROM anon;
-- get_receipt_by_id: keep anon EXECUTE (public receipt link)
```

After cleanup, anon callers can only call `get_receipt_by_id`. All other data access requires a valid Supabase Auth session.

---

## 11. Rollback Plan

**Failure at Steps 3–4 (before any JS deployed):**
```sql
DELETE FROM public.user_branch_roles WHERE user_id IN (SELECT id FROM public.app_users);
DELETE FROM auth.users WHERE email LIKE '%@cpcc.internal';
```
Live site still runs on old code. No user impact.

**Failure at Steps 6–7 (JS or RPCs deployed, but smoke test fails):**
```bash
git revert <step-6-commit>
npm run build && ./deploy.sh
```
Revert each RPC via `CREATE OR REPLACE FUNCTION` to `p_caller_id` versions.  
`auth.users` rows and `user_branch_roles` are untouched — old code works.

**Failure requiring full DB restore:**
```bash
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
pg_restore \
  "postgresql://postgres.rykxrnhwvvlwlxdzjyub:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres" \
  --no-owner --no-acl \
  ~/backups-local/attendance-backup-20260807-premigration.dump
```
Restores full DB to pre-migration state. All student/attendance/payment data intact.

---

## Pre-flight Checklist

Before starting Step 1:
- [ ] Fresh backup taken to `~/backups-local/`
- [ ] Temp password chosen (one password for all 6 users, communicated to them separately after)
- [ ] Supabase Dashboard access confirmed
- [ ] Live site traffic is low (off-hours — teachers don't use the app during migration)
- [ ] `SELECT id, username, role, branch_id FROM app_users ORDER BY role, username;` result saved locally — needed for Step 3 inserts
