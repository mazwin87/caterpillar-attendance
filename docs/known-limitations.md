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

### CALLER-ASSERT-NOTIFY — `notify_absent_parents` edge function

**Finding:** Low

`notify_absent_parents` still receives `caller_id` as a plain UUID in the POST body
(`attendance.service.js → runAbsentMarking` passes `session?.user?.id` from
`supabase.auth.getSession()`). The edge function independently verifies the role
against `app_users` using the service role key (H5 guard), so this is belt-and-
suspenders: a spoofed or missing `caller_id` is rejected before any action is taken.

The RPC call path (`run_daily_absent_marking`) was migrated to `auth.uid()` on
2026-08-10 — the edge function is the last caller-asserted path.

**Proper fix:** Update the edge function to read the caller's JWT from the
`Authorization: Bearer <token>` header (set automatically by `functions.invoke`)
and call `supabase.auth.getUser(jwt)` to get the caller UUID server-side. This
removes the body `caller_id` field entirely.

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
`is_super_admin()` and `get_my_branch_ids()`). If the two diverge, the UI shows
the new role but RLS still enforces the old one (or vice versa).

**Rule:** Build `set_user_role(target_id, new_role, new_branch_id)` SECURITY DEFINER
RPC (atomic, updates both tables in one transaction) before doing any role change
via UI or DB.

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
