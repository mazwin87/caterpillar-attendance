# Supabase DB Security Audit

**Project:** `rykxrnhwvvlwlxdzjyub` (attendance-system)  
**Date:** 2026-08-06  
**Scope:** Read-only. Tables: `app_users`, `attendance`, `students`, `payments`, `events`, `school_calendar`, `holidays`, `parents`. RPCs: `run_daily_absent_marking`, `reset_user_password`, `record_scan`. Helper functions: `is_super_admin`, `get_my_branch_ids`.

---

## 1. RLS Policies — Plain-English Summary

RLS is enabled on all audited tables (`relrowsecurity = true`). Two tiers of policies exist side-by-side: `anon_*` policies (open, no filter) and `branch_*` policies (scoped, require Supabase Auth). **All policies are PERMISSIVE**, meaning a row is visible/writable if *any one* policy matches. See §3 for why this makes the `branch_*` tier inert.

### `app_users`

| Policy | Role | Op | Effective rule |
|---|---|---|---|
| `anon_read_app_users` | anon | SELECT | Any caller can read all rows — including the `password` column (stored plaintext) |
| `allow anon update password` | anon | UPDATE | Any caller can update **any** row with no ownership check (`qual: true`, `with_check: true`) |

→ No INSERT or DELETE policy exists on `app_users`, but the above two are already critical (see §3-C1, C2).

### `attendance`

| Policy | Role | Op | Effective rule |
|---|---|---|---|
| `anon_read_attendance` | anon | SELECT | Any caller can read all attendance records, all branches |
| `anon_insert_attendance` | anon | INSERT | Any caller can insert any row — no branch or student validation |
| `anon_update_attendance` | anon | UPDATE | Any caller can update any row — no ownership check |
| `branch_attendance` | public | ALL | Authenticated user sees/writes own branch only — **inert** (see §3-C3) |

### `students`

| Policy | Role | Op | Effective rule |
|---|---|---|---|
| `anon_read_students` | anon | SELECT | Any caller reads all students across all branches |
| `anon_insert_students` | anon | INSERT | Any caller inserts students with no restriction |
| `anon_update_students` | anon | UPDATE | Any caller updates any student record |
| `anon_delete_students` | anon | DELETE | Any caller deletes any student — **no filter** |
| `branch_students` | public | ALL | Own-branch only for authenticated users — **inert** (see §3-C3) |

### `payments`

| Policy | Role | Op | Effective rule |
|---|---|---|---|
| `anon_all_payments` | anon | ALL | Any caller can read, create, update, and delete any payment record — no filter |

### `events`

| Policy | Role | Op | Effective rule |
|---|---|---|---|
| `anon_all_events` | anon | ALL | Any caller can read, create, update, and delete any event |

### `holidays`, `parents`, `school_calendar`

Same pattern: `anon_*` policies grant unrestricted SELECT/INSERT (and DELETE for holidays and school_calendar) to all anon callers. `branch_*` policies restrict authenticated users to own branch — inert for the same reason as above.

### `branches`

Both `public_read_branches` (all rows) and `read_own_branches` (scoped) exist. Since they are both PERMISSIVE, the unrestricted one dominates — all callers read all branches.

### `user_branch_roles`

| Policy | Role | Op | Effective rule |
|---|---|---|---|
| `own_roles` | public | SELECT | Authenticated users see their own role assignments, super_admin sees all |

→ No anon policy. This table is effectively unreadable to the app's anon key, which means `get_my_branch_ids()` always returns `[]` for app callers (see §3-C3).

---

## 2. RPC / Function Bodies

### `run_daily_absent_marking()` — called by `markAllAbsent`

```sql
CREATE OR REPLACE FUNCTION public.run_daily_absent_marking()
RETURNS void LANGUAGE plpgsql
-- NOTE: no SECURITY DEFINER — runs as the calling role (anon)
AS $$
DECLARE
  today DATE := (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::date;
BEGIN
  INSERT INTO attendance (student_id, branch_id, date, status)
  SELECT s.id, s.branch_id, today, 'ABSENT'
  FROM students s
  WHERE s.is_active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM attendance a
      WHERE a.student_id = s.id AND a.date = today
    );
END;
$$;
```

**What it does:** Inserts ABSENT records for every active student who has no attendance row for today (MYT).  
**Scoping:** ALL branches, ALL active students — no branch filter, no caller check.  
**Authorization:** None. No `SECURITY DEFINER`. Runs as `anon`, which the `anon_insert_attendance` policy already allows.

---

### `reset_user_password()` — called by `adminResetPassword`

Two overloads exist in the DB (the 2-arg version was not removed when the 3-arg version was added):

```sql
-- Overload 1 (old — always sets must_change_password = true)
CREATE OR REPLACE FUNCTION public.reset_user_password(p_user_id uuid, p_new_password text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE app_users
  SET password = p_new_password, must_change_password = true
  WHERE id = p_user_id;
END;
$$;

-- Overload 2 (current — p_must_change is caller-controlled)
CREATE OR REPLACE FUNCTION public.reset_user_password(
  p_user_id uuid, p_new_password text, p_must_change boolean DEFAULT false
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE app_users
  SET password = p_new_password, must_change_password = p_must_change
  WHERE id = p_user_id;
END;
$$;
```

**What it does:** Sets any user's password and `must_change_password` flag.  
**Authorization:** **None.** `SECURITY DEFINER` means it runs as `postgres`, bypassing all RLS. There is no `IF` check on the caller's identity or role before updating. Any caller — anon or authenticated — can reset the password of any user, including the superadmin.  
**Stale overload:** The 2-arg version is still callable. Any client passing only `(userId, password)` will hit it and get `must_change_password = true` unexpectedly.

---

### `record_scan(p_student_id)` — called by QR scanner

```sql
CREATE OR REPLACE FUNCTION public.record_scan(p_student_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_student students%ROWTYPE;
  v_hour    INTEGER;
  v_existing attendance%ROWTYPE;
BEGIN
  -- Gets student from DB (not from client input)
  SELECT * INTO v_student FROM students WHERE id = p_student_id AND is_active = TRUE;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Student not found'); END IF;

  -- Duplicate scan guard
  SELECT * INTO v_existing FROM attendance WHERE student_id = p_student_id AND date = CURRENT_DATE;
  IF FOUND THEN RETURN json_build_object('success', false, 'error', 'Already recorded today', ...); END IF;

  -- Holiday check
  IF EXISTS (SELECT 1 FROM holidays WHERE student_id = p_student_id AND CURRENT_DATE BETWEEN start_date AND end_date)
  THEN RETURN json_build_object('success', false, 'error', 'Student is on approved holiday'); END IF;

  -- PRESENT if before 9 AM MYT, LATE otherwise
  v_hour := EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur'));
  -- Insert with branch_id taken from the student record (not caller-supplied)
  INSERT INTO attendance (branch_id, student_id, date, status, scanned_at, scanned_by)
  VALUES (v_student.branch_id, p_student_id, CURRENT_DATE, v_status, NOW(), auth.uid());
  ...
END;
$$;
```

**What it does:** Validates student, checks duplicates and holidays, derives PRESENT/LATE from MYT hour, inserts attendance record.  
**Scoping note:** `branch_id` is taken from the student row, not from caller input — so branch cannot be spoofed via this RPC.  
**Authorization:** No caller identity check. Any anon user can scan any student into any branch. The "teacher can only scan own branch" rule is enforced client-side only (in `useAttendance.js`).

---

### Helper functions used by `branch_*` RLS policies

```sql
-- Returns true if auth.uid() has a 'super_admin' role assignment
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT EXISTS (SELECT 1 FROM user_branch_roles WHERE user_id = auth.uid() AND role = 'super_admin'); $$;

-- Returns array of branch_ids assigned to auth.uid()
CREATE OR REPLACE FUNCTION public.get_my_branch_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT ARRAY(SELECT branch_id FROM user_branch_roles WHERE user_id = auth.uid()); $$;
```

Both functions call `auth.uid()`. The app uses the **anon key** — not Supabase Auth — so `auth.uid()` is always `null` for every app request. `get_my_branch_ids()` always returns `[]`. `is_super_admin()` always returns `false`. The `branch_*` policies evaluate to `false` for all app calls (see §3-C3).

---

## 3. Findings — Security Posture

### CRITICAL

**C1 — `reset_user_password` has no caller authorization check**

The RPC is `SECURITY DEFINER` (runs as postgres, bypasses RLS) and contains zero identity verification. Any internet user with the anon key can call:
```
POST /rest/v1/rpc/reset_user_password
{ "p_user_id": "<any-uuid>", "p_new_password": "hacked", "p_must_change": false }
```
and reset any user's password, including the superadmin. The JS-layer check that "only admins call this function" is meaningless — nothing stops a direct API call.

**C2 — `app_users` passwords are plaintext and fully readable by anon**

Plaintext passwords are stored in the `password` column. The `anon_read_app_users` policy (`qual: true`) allows any anon SELECT with no filter. A single unauthenticated request to:
```
GET /rest/v1/app_users?select=username,password
```
returns all usernames and passwords for every user in the system.

Additionally, `allow anon update password` (`qual: true`, `with_check: true`) means any anon caller can UPDATE any row directly, without going through the RPC at all.

**C3 — The entire `branch_*` RLS tier is dead code for this application**

The `branch_attendance`, `branch_students`, `branch_holidays`, `branch_parents`, `branch_classes`, `manage_calendar` policies all depend on `get_my_branch_ids()` returning a non-empty array, or `is_super_admin()` returning true. Both require `auth.uid() IS NOT NULL`. The app uses the anon key, so `auth.uid()` is always null, both functions always return their "no match" values, and every `branch_*` policy is always false.

The only active policies are the `anon_*` ones, which grant unrestricted access to all tables. The intended branch-scoped access control layer **does not exist at runtime**.

---

### HIGH

**H1 — `run_daily_absent_marking` callable by anyone, at any time**

The RPC is not `SECURITY DEFINER` and has no authorization guard. It marks ALL active students across ALL branches as ABSENT if they have no attendance for today. Any unauthenticated caller can trigger this — an accidental double call or a malicious request mid-morning would mark all students absent before the school day ends.

**H2 — `students` DELETE is open to anon**

`anon_delete_students` allows any anon caller to delete any student record, including hard-deleting students from other branches. There is no `qual` filter — it applies to all rows.

**H3 — `payments` fully unprotected**

`anon_all_payments` grants SELECT, INSERT, UPDATE, and DELETE to all anon callers with no filter. All fee records, receipt numbers, and amounts are readable and modifiable without authentication.

**H4 — Branch isolation for attendance reads/writes is client-side only**

`getStudentsForBranch` adds `.eq('branch_id', branchId)` in JS. `upsertAttendance` passes `branch_id` from the student object. Nothing in the DB enforces these constraints for anon callers. A modified client or direct API call can read all students or write attendance records for any branch.

**H5 — `notify_absent_parents` edge function has no authentication**

The edge function (`supabase/functions/notify_absent_parents/index.ts`) accepts any HTTP request with no Authorization check. Any caller who knows the edge function URL can trigger mass Telegram notifications to all parents of absent students. The function uses the service role key internally, so it bypasses all RLS when querying absence data.

---

### MEDIUM

**M1 — `record_scan` allows scanning any student from any branch**

The "teacher can only scan students from their own branch" rule is enforced in `useAttendance.js:52-58` via a client-side `verifyStudentBranch` check. The `record_scan` RPC itself has no such check. A direct RPC call bypasses the branch guard entirely.

**M2 — Stale 2-arg overload of `reset_user_password` still exists**

The original `reset_user_password(uuid, text)` overload (which always sets `must_change_password = true`) was never dropped when the 3-arg version was added. Both are callable. A caller using only 2 args — or a dependency that doesn't pass `p_must_change` — will silently hit the old overload.

**M3 — `relforcerowsecurity = false` on all tables**

Table owners (the `postgres` role) bypass RLS even with it enabled. Any `SECURITY DEFINER` function effectively has superuser-level access to all tables. This is the correct behavior for `record_scan` (server-enforced writes), but it means `reset_user_password` bypasses not just the `app_users` RLS but also any other guards that might be added later.

---

## 4. Summary Table

| ID | Severity | What is exposed | Mechanism |
|---|---|---|---|
| C1 | **Critical** | Any user's password can be reset without auth | `reset_user_password` is SECURITY DEFINER with no caller check |
| C2 | **Critical** | All plaintext passwords readable + writable by anon | `anon_read_app_users` + `allow anon update password` with `qual: true` |
| C3 | **Critical** | Branch-scoped RLS layer never activates | App uses anon key; `auth.uid()` is always null; all `branch_*` policies are always false |
| H1 | High | Anyone can mass-mark all students absent | `run_daily_absent_marking` has no auth check |
| H2 | High | Anyone can delete any student | `anon_delete_students` with no row filter |
| H3 | High | All payment records exposed and modifiable | `anon_all_payments` with no filter |
| H4 | High | Branch isolation for reads/writes is JS only | DB allows any anon to read/write any branch's data |
| H5 | High | Anyone can spam Telegram notifications to all parents | Edge function has no Authorization check |
| M1 | Medium | Teacher branch restriction for QR scan is JS only | `record_scan` RPC has no branch check |
| M2 | Medium | Stale 2-arg `reset_user_password` overload still callable | Old function not dropped |
| M3 | Medium | SECURITY DEFINER functions bypass all RLS | Expected behavior but compounds C1 severity |

---

## 5. Notes for Fix Planning

The root cause of C3 (and most of H4) is that the application never migrated to Supabase Auth — it uses a custom `app_users` table with plaintext passwords and the anon key for all requests. Fixing C3 properly requires either:

- **Option A:** Move to Supabase Auth (email+password). The existing `branch_*` policies are already written for this and would activate immediately.
- **Option B:** Keep custom auth but pass a per-request signed JWT (e.g., issued by an edge function after login). `auth.uid()` would then be non-null and the `branch_*` policies would work.

C1 and C2 are independent of the auth strategy and should be fixed regardless: `reset_user_password` needs an internal role check, and `app_users` UPDATE/SELECT policies need `qual` filters scoped to the requesting user's own row.
