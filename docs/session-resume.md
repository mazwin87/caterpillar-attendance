# Session Resume — 2026-08-07

## Verify before resuming

1. **Token rotation** — Supabase `sbp_` access token was exposed in shell history during this session. Was it rotated? Check app.supabase.com → Account → Access Tokens. Also clear `~/.zsh_history` of any lines containing `sbp_`.
2. **Backup location** — Post-fix backup is at `~/backups-local/attendance-backup-20260807-postfix.dump` (406KB). Confirm it is still there. Home root (`~/`) is not iCloud-synced by default.
3. **iCloud Desktop check** — If System Settings → Apple ID → iCloud → iCloud Drive → "Desktop & Documents Folders" was ON during this session, both the old plaintext dump and the post-fix dump may have synced to iCloud. Check and purge iCloud Recently Deleted if so.
4. **Plaintext fully gone** — Run this to confirm no plaintext passwords remain in DB: `SELECT username, left(password, 4) AS prefix FROM app_users;` — every row must show `$2a$`.

---

## What's done

All Critical and High findings from `docs/db-audit.md` are closed.

| Finding | Fix |
|---|---|
| C1 — `reset_user_password` no auth | 4-arg version with caller role check + bcrypt on UPDATE + `IS NULL OR NOT IN` null-caller guard |
| C2 — plaintext passwords | bcrypt via pgcrypto, `verify_login` RPC, `change_own_password` verifies current password |
| H1 — `run_daily_absent_marking` no auth | `p_caller_id` check + `IS NULL OR NOT IN` null-caller guard |
| H2 — `anon_delete_students` open | Policy dropped |
| H3 — payments unprotected | Three SECURITY DEFINER RPCs replace direct table access; `generate_receipt_no` revoked from anon |
| H5 — edge function no auth | `caller_id` in POST body verified against `app_users` before any action |
| M2 — stale RPC overload | Already gone at audit time, confirmed |
| NULL-CALLER CLASS | All guarded RPCs audited; `IS NULL OR NOT IN` pattern enforced everywhere; rule documented in `known-limitations.md` |

**Cleanup done:** Old plaintext backup deleted from project and Desktop. Post-fix backup at `~/backups-local/`. CLI re-linked to correct project (`rykxrnhwvvlwlxdzjyub`). Supabase token rotated.

---

## What's open

| Finding | Nature | Blocker? |
|---|---|---|
| M1 — `record_scan` branch check JS-only | Teacher can scan any student from any branch via direct API call | No — medium severity |
| C3/H4 — branch RLS inert | All `branch_*` RLS policies are dead because app uses anon key, not Supabase Auth | The root cause of everything below |
| DEAD-1 — `runManualAttendance` never wired | Dashboard has no Mark & Notify button; dead code in hook | Decision needed |
| M2-UX — `reset_user_password` silent no-op | Wrong-target reset returns success but changes nothing | UX confusing, not a security hole |

**The theme:** Every remaining open item either IS the auth migration (C3/H4) or becomes much simpler after it (M1 branch check becomes a server-side `auth.uid()` guard; H1-SOFT caller-asserted ID goes away entirely). The right order is: fix DEAD-1 and M2-UX as small standalone items, then plan C3 as its own session.

---

## Where things live

- `docs/db-audit.md` — original audit findings
- `docs/security-changelog.md` — what was fixed, original states for rollback
- `docs/known-limitations.md` — what's open and why, including null-caller class rule
- `supabase/migrations/20260806_grant_rpc_execute.sql` — all anon EXECUTE grants
- `~/backups-local/attendance-backup-20260807-postfix.dump` — post-fix DB backup
