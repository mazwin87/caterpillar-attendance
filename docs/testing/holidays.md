# Holidays Module — Test Documentation

**Module short name:** `holidays`  
**Route:** `/holidays`  
**Component entry:** `src/components/Holidays.jsx` → `src/components/features/holidays/HolidaysPage.jsx`  
**Last tested:** —  
**Tester:** —

---

## Preconditions

Before running any test case:

1. Dev server is running: `npm run dev` → http://localhost:3000/cpcc/
2. Logged in. Some tests require **admin** role (school closures); student leave is accessible to all roles.
3. At least one branch and one active student exist in the database.
4. Network tab open in DevTools to catch failed Supabase requests.

---

## Test Cases

### TC-H-01 — Page load

| Field | Detail |
|---|---|
| **What** | Holidays page loads data without errors |
| **Steps** | 1. Navigate to `/holidays` |
| **Expected** | Spinner shows briefly; "Student Leave" tab is active by default; list or empty-state renders; no console errors |
| **Status** | — |

---

### TC-H-02 — Tab switch to School Closures

| Field | Detail |
|---|---|
| **What** | Tab switch renders the closures list |
| **Steps** | 1. Navigate to `/holidays` → click "School Closures" tab |
| **Expected** | Closures list (or empty-state) renders; "Add" button visible only for admin users; info note about cron suppression visible |
| **Status** | — |

---

### TC-H-03 — Add student leave (happy path)

| Field | Detail |
|---|---|
| **What** | Admin/teacher can record a student leave |
| **Steps** | 1. Click "+ Add" on Student Leave tab → 2. Select a branch → 3. Select a student from that branch → 4. Set start date and end date → 5. Optionally enter a reason → 6. Tap "Save" |
| **Expected** | Modal closes; new leave entry appears at the top of the list immediately (optimistic update); correct student name, dates, and reason shown |
| **Status** | — |

---

### TC-H-04 — Branch filter narrows student dropdown

| Field | Detail |
|---|---|
| **What** | Selecting a branch in the leave form filters the student list |
| **Steps** | 1. Open Add student leave modal → 2. Select "Branch A" → 3. Inspect student dropdown |
| **Expected** | Only students belonging to Branch A appear; students from other branches are excluded |
| **Status** | — |

---

### TC-H-05 — Add leave form validation — required fields

| Field | Detail |
|---|---|
| **What** | Form does not submit if required fields are empty |
| **Steps** | 1. Open Add student leave modal → 2. Leave branch, student, and dates blank → 3. Tap "Save" |
| **Expected** | Browser native `required` validation prevents submit; no Supabase insert is made |
| **Status** | — |

---

### TC-H-06 — Active badge on leave in progress

| Field | Detail |
|---|---|
| **What** | A leave whose date range includes today shows an "Active" badge |
| **Steps** | 1. Add a leave with start_date ≤ today ≤ end_date → 2. View the Student Leave list |
| **Expected** | "Active" badge (holiday colour) appears beside that entry; future or past leaves show no badge |
| **Status** | — |

---

### TC-H-07 — Delete student leave

| Field | Detail |
|---|---|
| **What** | A leave entry can be deleted |
| **Steps** | 1. Tap "Actions" on a leave entry → 2. Tap "Delete" → 3. Confirm the dialog |
| **Expected** | Entry removed from list immediately; Supabase delete confirmed in Network tab; cancelling the confirm dialog makes no change |
| **Status** | — |

---

### TC-H-08 — Actions menu closes on outside tap

| Field | Detail |
|---|---|
| **What** | Tapping outside an open Actions menu collapses it |
| **Steps** | 1. Tap "Actions" on any leave entry → 2. Tap anywhere outside that card |
| **Expected** | Actions menu collapses; no delete is triggered |
| **Status** | — |

---

### TC-H-09 — Add school closure (admin only)

| Field | Detail |
|---|---|
| **What** | Admin can add a school closure |
| **Steps** | 1. Switch to "School Closures" tab → 2. Click "+ Add" → 3. Enter a label (e.g. "Hari Raya") → 4. Set start and end dates → 5. Tap "Save" |
| **Expected** | Modal closes; new closure appears at top of list with label and date range; if start_date ≥ today an "Upcoming" badge shows |
| **Status** | — |

---

### TC-H-10 — Add button hidden on closures tab for non-admin

| Field | Detail |
|---|---|
| **What** | Non-admin users cannot add school closures |
| **Steps** | 1. Log in as a non-admin user → 2. Navigate to `/holidays` → 3. Switch to "School Closures" tab |
| **Expected** | "+ Add" button is not rendered; "Actions" button is not rendered on closure cards |
| **Status** | — |

---

### TC-H-11 — Upcoming badge on future closure

| Field | Detail |
|---|---|
| **What** | A closure with date ≥ today shows "Upcoming" badge |
| **Steps** | 1. Add a closure with a future date → 2. View closures list |
| **Expected** | "Upcoming" badge (holiday colour) appears; date text rendered in holiday colour |
| **Status** | — |

---

### TC-H-12 — Multi-day closure date range formatting

| Field | Detail |
|---|---|
| **What** | A closure spanning multiple days formats its date range correctly |
| **Steps** | 1. Add a closure where end_date ≠ start_date → 2. View the closure card |
| **Expected** | Date shown as "1 January 2026 — 3 January 2026"; single-day closure shows weekday + date (e.g. "Thursday, 1 January 2026") |
| **Status** | — |

---

### TC-H-13 — Delete school closure (admin)

| Field | Detail |
|---|---|
| **What** | Admin can delete a school closure |
| **Steps** | 1. Tap "Actions" on a closure → 2. Tap "Delete" → 3. Confirm dialog |
| **Expected** | Closure removed from list; Supabase delete confirmed in Network tab |
| **Status** | — |

---

### TC-H-14 — Auto-purge of past closures on page load

| Field | Detail |
|---|---|
| **What** | Closures whose end_date is in the past are silently removed from the database on load |
| **Steps** | 1. (Setup) Manually insert a `school_calendar` row with `end_date` = yesterday via Supabase dashboard → 2. Navigate to `/holidays` → switch to "School Closures" |
| **Expected** | Past closure does not appear in the list; Supabase delete of that row is visible in Network tab |
| **Status** | — |

---

### TC-H-15 — Cancel buttons dismiss modals without saving

| Field | Detail |
|---|---|
| **What** | Tapping Cancel or × on either modal discards the form |
| **Steps** | 1. Open Add student leave modal → fill in fields → tap "Cancel" (repeat for "×" and for the school closure modal) |
| **Expected** | Modal closes; no Supabase insert is made; list unchanged |
| **Status** | — |

---

### TC-H-16 — Backdrop tap dismisses modal

| Field | Detail |
|---|---|
| **What** | Tapping the dark backdrop closes the modal |
| **Steps** | 1. Open Add student leave modal → 2. Tap the dark overlay outside the sheet |
| **Expected** | Modal closes; no data is submitted |
| **Status** | — |

---

## Regression Notes

- Adding a student leave must **not** affect the closures list and vice versa — they write to different tables (`holidays` vs `school_calendar`).
- The auto-purge on load must only delete closures whose `end_date` is strictly before today — closures ending today must be kept.
- The "Active" badge logic (`start_date ≤ today ≤ end_date`) is independent of the auto-purge logic; both must work without interfering.
