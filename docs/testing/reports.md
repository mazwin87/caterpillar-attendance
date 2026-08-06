# Reports Module — Test Documentation

**Module short name:** `reports`  
**Route:** `/reports`  
**Component entry:** `src/components/Reports.jsx` → `src/components/features/reports/ReportsPage.jsx`  
**Last tested:** —  
**Tester:** —

---

## Preconditions

Before running any test case:

1. Dev server is running: `npm run dev` → http://localhost:3000/cpcc/
2. Logged in as **admin** (reports route is admin-only).
3. At least one branch with attendance records in the past 7 days exists.
4. Network tab open in DevTools to catch failed Supabase requests.

---

## Test Cases

### TC-R-01 — Page load

| Field | Detail |
|---|---|
| **What** | Reports page loads with sensible defaults |
| **Steps** | 1. Navigate to `/reports` |
| **Expected** | "From" date defaults to 7 days ago; "To" date defaults to today; "All branches" selected; record list is empty (no auto-search); no console errors |
| **Status** | — |

---

### TC-R-02 — Search with default date range

| Field | Detail |
|---|---|
| **What** | Tapping Search fetches records for the last 7 days |
| **Steps** | 1. Navigate to `/reports` → 2. Tap "Search" without changing any filter |
| **Expected** | Spinner appears briefly; records grouped by date (most recent first) render; record count shown beside each date header |
| **Status** | — |

---

### TC-R-03 — Branch filter narrows results

| Field | Detail |
|---|---|
| **What** | Selecting a branch returns only that branch's attendance |
| **Steps** | 1. Select a specific branch → 2. Tap "Search" |
| **Expected** | All returned records belong to the selected branch; students from other branches absent |
| **Status** | — |

---

### TC-R-04 — Custom date range

| Field | Detail |
|---|---|
| **What** | Custom From/To dates are respected |
| **Steps** | 1. Set "From" = first day of last month, "To" = last day of last month → 2. Tap "Search" |
| **Expected** | Only records with `date` within that range returned; no records outside the range |
| **Status** | — |

---

### TC-R-05 — Empty state after search

| Field | Detail |
|---|---|
| **What** | A period with no records shows an empty state |
| **Steps** | 1. Set a future date range (e.g. next month) → 2. Tap "Search" |
| **Expected** | "No records found for this period" message shown; export buttons not rendered |
| **Status** | — |

---

### TC-R-06 — Export buttons appear only after search with results

| Field | Detail |
|---|---|
| **What** | Export CSV and Export PDF buttons are conditional |
| **Steps** | 1. On fresh page load — confirm no export buttons visible → 2. Search with a date range that has records → confirm export buttons appear |
| **Expected** | Buttons absent before first search; present once records are returned |
| **Status** | — |

---

### TC-R-07 — Export CSV

| Field | Detail |
|---|---|
| **What** | CSV download contains correct columns and data |
| **Steps** | 1. Search with a date range that has records → 2. Tap "📥 Export CSV" → 3. Open the downloaded file |
| **Expected** | File named `attendance_<startDate>_<endDate>.csv`; columns: Date, Name, Student No, Branch, Class, Status, Absence Reason, Scan Time; one row per attendance record; values quoted |
| **Status** | — |

---

### TC-R-08 — Export PDF opens print dialog

| Field | Detail |
|---|---|
| **What** | PDF export opens a print-ready HTML page |
| **Steps** | 1. Search with records → 2. Tap "🖨️ Export PDF" |
| **Expected** | New tab opens with formatted HTML table; browser print dialog appears; header shows branch name, date range, and record count |
| **Status** | — |

---

### TC-R-09 — PDF branch name in header

| Field | Detail |
|---|---|
| **What** | PDF header reflects the selected branch filter |
| **Steps** | 1. Select "Branch A" → Search → Export PDF → 2. Repeat with "All branches" → Export PDF |
| **Expected** | PDF header shows the actual branch name when filtered; shows "All Branches" when no branch filter selected |
| **Status** | — |

---

### TC-R-10 — Records grouped by date, most recent first

| Field | Detail |
|---|---|
| **What** | Date grouping and sort order are correct |
| **Steps** | 1. Search across a multi-day range with records on different dates |
| **Expected** | Most recent date group appears at the top; records within each group sorted by status (ascending alphabetical: ABSENT, HOLIDAY, LATE, PRESENT) |
| **Status** | — |

---

### TC-R-11 — Status badge colours match the shared STATUS constant

| Field | Detail |
|---|---|
| **What** | Status badges in the table use the correct colours (not the old diverging local map) |
| **Steps** | 1. Search for records → 2. Visually compare PRESENT/LATE/ABSENT/HOLIDAY badge colours against the Dashboard page |
| **Expected** | Colours identical between Reports and Dashboard for each status |
| **Status** | — |

---

### TC-R-12 — Absence reason shown under ABSENT status

| Field | Detail |
|---|---|
| **What** | An absent record with a reason displays it below the status badge |
| **Steps** | 1. Search for a date range where at least one student has an absence reason set → 2. Find that record |
| **Expected** | Absence reason text appears below the ABSENT badge; underscores replaced with spaces (e.g. "not well" not "not_well") |
| **Status** | — |

---

### TC-R-13 — Scan time shown for present/late records

| Field | Detail |
|---|---|
| **What** | Records with a `scanned_at` timestamp show scan time |
| **Steps** | 1. Search a range with QR-scanned attendance → 2. Inspect a PRESENT or LATE record |
| **Expected** | Scan time shown in HH:MM format; absent/holiday records with no scan time show nothing |
| **Status** | — |

---

### TC-R-14 — Search again with different filters replaces results

| Field | Detail |
|---|---|
| **What** | A second search fully replaces the previous result set |
| **Steps** | 1. Search with "All branches" → note record count → 2. Select a specific branch → Search again |
| **Expected** | Previous results replaced; new count reflects branch-filtered result only |
| **Status** | — |

---

## Regression Notes

- `STATUS_COLORS` / `STATUS_BG` local maps have been removed. All colour references now go through `lib/constants/attendance.js` → `STATUS`. If badge colours look wrong, check that constant first.
- CSV and PDF generation live in `ExportControls.jsx` and `lib/utils/csv.js` — changes there must not affect other modules that also use `lib/utils/print.js`.
- The `useReports` hook initialises `startDate` to 7 days ago using `Date.now()` at hook creation time, not at render time — this means the default is stable and won't drift during a session.
