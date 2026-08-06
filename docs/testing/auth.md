# Auth Module — Test Documentation

**Module short name:** `auth`  
**Routes:** `/` (login), forced change password screen, `/manage-users`  
**Component entries:**
- `src/components/Login.jsx` → `src/components/features/auth/LoginForm.jsx`
- `src/components/ChangePassword.jsx` → `src/components/features/auth/ChangePasswordForm.jsx`
- `src/components/ManageUsers.jsx` → `src/components/features/auth/ManageUsersPage.jsx`  

**Last tested:** —  
**Tester:** —

---

## Preconditions

Before running any test case:

1. Dev server is running: `npm run dev` → http://localhost:3000/cpcc/
2. Have credentials ready for: an **admin** account, a **teacher** account, a **superadmin** account.
3. Have at least one teacher account with `must_change_password = true` in `app_users` (for TC-A-05).
4. Network tab open in DevTools to catch failed Supabase requests.

---

## Login (LoginForm)

### TC-A-01 — Successful admin login

| Field | Detail |
|---|---|
| **What** | Admin can sign in and reaches the scanner page |
| **Steps** | 1. Navigate to the app root → 2. Enter valid admin username and password → 3. Tap "Sign in" |
| **Expected** | Redirected to `/scanner`; session stored in `localStorage` key `caterpillar_session`; session includes correct `role`, `branch_id`, and today's date |
| **Status** | — |

---

### TC-A-02 — Teacher login shows name field

| Field | Detail |
|---|---|
| **What** | Typing a teacher username reveals the "Your name" field |
| **Steps** | 1. Start typing a known teacher username into the username field |
| **Expected** | After 2+ characters typed, a "Your name e.g. Cikgu Siti" input slides into view; field is `required` |
| **Status** | — |

---

### TC-A-03 — Teacher login requires name

| Field | Detail |
|---|---|
| **What** | Teacher cannot sign in without entering their name |
| **Steps** | 1. Enter valid teacher username and password → leave name blank → tap "Sign in" |
| **Expected** | Error "Please enter your name." shown; no session created; no navigation |
| **Status** | — |

---

### TC-A-04 — Incorrect credentials

| Field | Detail |
|---|---|
| **What** | Wrong password shows error without navigating |
| **Steps** | 1. Enter valid username + wrong password → tap "Sign in" |
| **Expected** | Error "Incorrect username or password." shown; no session created |
| **Status** | — |

---

### TC-A-05 — Session expires at midnight

| Field | Detail |
|---|---|
| **What** | A session from a previous day is treated as expired |
| **Steps** | 1. Manually edit `caterpillar_session` in localStorage to set `date` to yesterday → 2. Refresh the page |
| **Expected** | Redirected to login screen; session entry removed from localStorage |
| **Status** | — |

---

## Force Change Password (ChangePasswordForm)

### TC-A-06 — Must-change screen shown for flagged accounts

| Field | Detail |
|---|---|
| **What** | A user with `must_change_password = true` is blocked from the app until they change their password |
| **Steps** | 1. Log in with an account that has `must_change_password = true` in `app_users` |
| **Expected** | After login, the "Change Password" screen is shown instead of the scanner; the user cannot navigate away |
| **Status** | — |

---

### TC-A-07 — Successful password change

| Field | Detail |
|---|---|
| **What** | A valid new password is accepted and the user proceeds |
| **Steps** | 1. On the Change Password screen → 2. Enter a new password (≥ 6 chars) → 3. Confirm it → 4. Tap "Set New Password" |
| **Expected** | `must_change_password` updated to `false` in `app_users`; session updated accordingly; user redirected to scanner |
| **Status** | — |

---

### TC-A-08 — Short password rejected

| Field | Detail |
|---|---|
| **What** | Password shorter than 6 characters is rejected client-side |
| **Steps** | 1. Enter "abc" as new password and confirm → tap "Set New Password" |
| **Expected** | Error "Password must be at least 6 characters." shown; no Supabase call made |
| **Status** | — |

---

### TC-A-09 — Mismatched passwords rejected

| Field | Detail |
|---|---|
| **What** | Non-matching confirm password is rejected client-side |
| **Steps** | 1. Enter "password1" and "password2" → tap "Set New Password" |
| **Expected** | Error "Passwords do not match." shown; no Supabase call made |
| **Status** | — |

---

## Manage Users (ManageUsersPage)

### TC-A-10 — User list loads for admin

| Field | Detail |
|---|---|
| **What** | Admin sees only teachers in their own branch |
| **Steps** | 1. Log in as admin → navigate to `/manage-users` |
| **Expected** | Only teacher accounts belonging to the admin's branch are listed; no admin or superadmin accounts shown |
| **Status** | — |

---

### TC-A-11 — User list loads for superadmin

| Field | Detail |
|---|---|
| **What** | Superadmin sees all admins and teachers across all branches |
| **Steps** | 1. Log in as superadmin → navigate to `/manage-users` |
| **Expected** | All non-superadmin accounts listed; role labels and branch names shown for each |
| **Status** | — |

---

### TC-A-12 — Admin reset password modal opens

| Field | Detail |
|---|---|
| **What** | Tapping "Reset" opens a center modal for that user |
| **Steps** | 1. On `/manage-users` → tap "Reset" beside a user |
| **Expected** | Center modal appears with username displayed; two password fields; no data pre-filled |
| **Status** | — |

---

### TC-A-13 — Successful password reset

| Field | Detail |
|---|---|
| **What** | Admin can reset another user's password |
| **Steps** | 1. Open reset modal for a user → 2. Enter a valid new password and confirm → 3. Tap "Reset Password" |
| **Expected** | Modal closes; toast "Password reset for \<username\>" appears for 3 seconds; user can log in with new password |
| **Status** | — |

---

### TC-A-14 — Reset validation matches change-password rules

| Field | Detail |
|---|---|
| **What** | Same short/mismatch validations apply in the reset modal |
| **Steps** | 1. Enter "ab" and "ab" → tap Reset → note error → 2. Enter "abc123" and "xyz123" → tap Reset → note error |
| **Expected** | "at least 6 characters" error for case 1; "do not match" error for case 2; no Supabase call in either case |
| **Status** | — |

---

### TC-A-15 — Modal closes on backdrop tap

| Field | Detail |
|---|---|
| **What** | Tapping the dark overlay dismisses the reset modal without submitting |
| **Steps** | 1. Open reset modal → 2. Tap the dark backdrop |
| **Expected** | Modal closes; no password change made |
| **Status** | — |

---

### TC-A-16 — Back button returns to admin panel

| Field | Detail |
|---|---|
| **What** | The ← back button navigates to `/admin` |
| **Steps** | 1. Navigate to `/manage-users` → tap the back arrow in the header |
| **Expected** | Navigates to `/admin` page |
| **Status** | — |

---

## Regression Notes

- The Supabase password query (`eq('password', ...)`) is now isolated in `lib/services/users.service.js → loginWithCredentials()`. Any future auth strategy change (e.g. bcrypt) should only touch that function.
- `lib/auth.js` (localStorage session helpers) is unchanged — it has no Supabase dependency and is safe to use from any layer.
- The teacher-name field visibility is driven by a live role lookup (`getUserRole`) on each username keystroke after 2 characters. This is a network call — confirm it does not fire on every keystroke past 2 chars under slow network conditions.
- `must_change_password` flag is cleared via a direct `app_users` update in `changeOwnPassword()`, not via the RPC used for admin resets. These are two different code paths — test both independently.
