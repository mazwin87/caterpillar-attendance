# Known Limitations

Security and design limitations recorded but not yet resolved.
Each entry notes the finding ID from `db-audit.md`, the nature of the limitation, and the proper long-term fix.

---

## RESOLVED (2026-08-07 — Supabase Auth migration)

### C3 / M1 — Branch isolation now enforced at DB level

All eight public tables (`students`, `attendance`, `parents`, `holidays`, `events`,
`school_calendar`, `payments`, `app_users`) now have branch-scoped RLS using
`is_super_admin() OR branch_id = ANY(get_my_branch_ids())` (or an EXISTS subquery
for `parents`, which has no direct `branch_id`). The anon key returns `[]` on all
tables — confirmed via curl post-cleanup.

### H1-SOFT / H4 — Caller-asserted UUID in auth paths eliminated

Login now uses `supabase.auth.signInWithPassword`; `auth.uid()` is set server-side
and cannot be spoofed. Password change uses `supabase.auth.updateUser` +
`clear_my_must_change_password()` SECURITY DEFINER RPC. Admin password reset uses
an Edge Function that verifies the caller's JWT via `admin.auth.getUser(jwt)` before
touching any user record. The `anon_read_app_users` policy that exposed admin UUIDs
to anonymous callers is also dropped.

### M2-UX — `reset_user_password` silent no-op

`reset_user_password` RPC dropped entirely. Replaced by `admin-reset-password` Edge
Function which returns explicit HTTP errors (401 Unauthorized, 404 Not Found, 500)
for every failure case.

### NULL-CALLER class — dead RPCs removed

`verify_login(text, text)` and `change_own_password(uuid, text, text)` are dead —
replaced by Supabase Auth client calls. `reset_user_password(uuid, uuid, text, bool)`
was dropped in the cleanup pass. The fail-open `NOT IN` risk no longer applies to
these paths.

---

## Still Open

### CALLER-ASSERT-REMAINING — `get_payments`, `create_payment`, `run_daily_absent_marking`

**Finding:** Medium

These three RPCs still accept `p_caller_id uuid` from the client rather than reading
`auth.uid()` server-side:

| RPC | Caller guard | Risk |
|---|---|---|
| `get_payments(uuid)` | `IS NULL OR NOT IN ('admin','superadmin')` | Fail-closed; branch RLS also filters output |
| `create_payment(uuid,...)` | `IS NULL OR NOT IN ('admin','superadmin')` | Fail-closed; branch RLS also filters |
| `run_daily_absent_marking(uuid)` | `IS NULL OR NOT IN ('admin','superadmin')` | Fail-closed |

Practical risk is low now that branch RLS is active (even a spoofed admin UUID can
only affect rows in branches the caller's JWT has access to), but the caller-asserted
pattern is still a code smell and should be migrated to `auth.uid()` in the next DB
maintenance pass.

**Proper fix:** Replace `p_caller_id` with `auth.uid()` inside each RPC; remove the
parameter from all call sites.

---

### DEPLOY-HARDENING — Live deploy uses `root@` over SSH

The VPS deploy script runs as `root`. No immediate exploit — the server hosts only
this app — but best practice is a dedicated deploy user with limited permissions.

**Proper fix:** Create a `deploy` user, scope it to the app directory, update the
deploy script.

---

### ROLE-DRIFT — Role change requires two-table update

A user's role is stored in two places: `app_users.role` (used by JS session +
Edge Function guards) and `user_branch_roles.role` (used by RLS helper functions
`is_super_admin()` and `get_my_branch_ids()`). Changing a user's role via the
Manage Users UI updates only `app_users`. If `user_branch_roles` is not also updated
manually, the two diverge: the UI shows the new role but RLS still enforces the old
one (or vice versa).

**Proper fix:** Write an atomic `set_user_role(target_id, new_role, new_branch_id)`
SECURITY DEFINER RPC that updates both tables in one transaction. Until then, any
role change must be done directly in the database.

---

### PRE-AUTH-UX — `getUserRole` removed; pre-login role display needs a public RPC

The login form previously called `getUserRole(username)` on every keystroke to
show/hide the teacher-name field before authentication. This required the
`anon_read_app_users` policy. Both are now removed.

The teacher-name step now appears after a successful login (two-step flow). If a
future UX requirement needs pre-login role display (e.g. showing a role badge while
typing), the correct implementation is a narrow `SECURITY DEFINER` RPC that returns
only the role for a given username — not an anon read policy on `app_users`.

---

### DEAD-1 — `markAllAbsent` / `runManualAttendance` never wired to UI

`dashboard.service.js → markAllAbsent(callerId)` is called only by
`useDashboard.js → runManualAttendance()`, which is returned from the hook but
consumed by no component. No button or route calls it.

The only live absent-marking path is the scanner page admin button
(`AdminScannerControls → runNow → runAbsentMarking`).

**Decision needed:** Wire `runManualAttendance` to a dashboard button (with role
guard), or remove both `markAllAbsent` and `runManualAttendance` to reduce dead
surface area. Do not act without confirming intended dashboard behaviour.
