# Dashboard — Test Cases

**Module:** `dashboard`  
**Route:** `/` (default tab after login)  
**Last verified:** 2026-08-06

---

## Preconditions

- At least one student with attendance recorded today
- At least one student absent (no attendance row) for override tests
- Logged in as admin for override tests (TC-DB-09 through TC-DB-12)
- Logged in as teacher for role-scoping tests (TC-DB-13, TC-DB-14)

---

## TC-DB-01 — Page loads with today's date and role badge

**Steps:**
1. Navigate to Dashboard

**Expected:**
- Header shows today's date in full format (e.g. "WEDNESDAY, 6 AUGUST 2026")
- "Today's overview" heading visible
- Admin role: green shield icon + "Admin" label
- Teacher role: school icon + teacher name + branch short-name (e.g. "Sentul")

---

## TC-DB-02 — Status totals grid shows four tiles

**Steps:**
1. Navigate to Dashboard and wait for load

**Expected:**
- Four tiles in a 2×2 grid: Present, Late, Absent, Holiday
- Each tile shows a count (number, may be 0)
- Colors match theme: Present = green, Late = orange, Absent = red, Holiday = yellow
- No tile is active (no colored border) by default

---

## TC-DB-03 — Loading spinner shown while fetching

**Steps:**
1. Navigate to Dashboard (observe immediately before data loads)

**Expected:**
- Centered green spinning ring visible
- Status grid and branch cards do not render yet

---

## TC-DB-04 — Click status tile opens all-branches drilldown

**Steps:**
1. Click the "Present" tile

**Expected:**
- Tile gains colored border (active state)
- Drilldown panel appears below the grid
- Header: green dot + "Present · All branches"
- List shows all students with PRESENT status across all branches today
- Each row shows: initial avatar, student name, student number, branch short-name, status badge, scanned time

---

## TC-DB-05 — Click same tile again closes drilldown

**Steps:**
1. Click "Present" tile to open drilldown
2. Click "Present" tile again

**Expected:**
- Drilldown panel disappears
- Tile returns to inactive state

---

## TC-DB-06 — Close button closes drilldown

**Steps:**
1. Click any status tile to open drilldown
2. Click × button in drilldown header

**Expected:**
- Drilldown closes
- Tile returns to inactive state

---

## TC-DB-07 — Click different tile switches drilldown

**Steps:**
1. Click "Present" tile
2. Click "Absent" tile

**Expected:**
- Drilldown switches to Absent list (header changes, list contents change)
- "Absent" tile is now active; "Present" tile is inactive

---

## TC-DB-08 — Absent rows show absence reason or "no reason yet"

**Steps:**
1. Open Absent drilldown

**Expected:**
- Students with an `absence_reason` show it in lowercase (e.g. "sick", "no reason")
- Students with no `absence_reason` show italic "no reason yet" in muted color

---

## TC-DB-09 — Admin can tap a student row to open override picker

**Steps:**
1. Log in as admin
2. Open any status drilldown
3. Tap/click a student row

**Expected:**
- Row background changes to `var(--bg)` (slightly different shade)
- Override picker appears below the row: "CHANGE STATUS TO:" label + three buttons (Present, Late, Absent)
- Current status button is highlighted (colored bg + colored text)
- HOLIDAY excluded from picker options

---

## TC-DB-10 — Override status updates the row immediately

**Steps:**
1. Open Present drilldown
2. Tap a student row to open override picker
3. Click "Late" button

**Expected:**
- Row status badge changes to "LATE" with late color
- Override picker closes
- Summary totals grid updates (Present count −1, Late count +1)

---

## TC-DB-11 — Tapping the same row again closes override picker

**Steps:**
1. Open drilldown, tap a student row to open picker
2. Tap the same student row again

**Expected:**
- Override picker closes
- Row returns to normal background

---

## TC-DB-12 — Teacher cannot open override picker

**Steps:**
1. Log in as teacher
2. Open any status drilldown
3. Tap/click a student row

**Expected:**
- No override picker appears
- Cursor does not change to pointer on hover

---

## TC-DB-13 — Teacher sees only their branch in summary

**Steps:**
1. Log in as teacher assigned to "Sentul" branch

**Expected:**
- Status totals grid shows counts for Sentul only
- Branch cards section shows only the Sentul card
- No other branches visible

---

## TC-DB-14 — Teacher drilldown filtered to their branch

**Steps:**
1. Log in as teacher
2. Click any status tile

**Expected:**
- Drilldown only shows students from teacher's assigned branch

---

## TC-DB-15 — Branch cards show name, student count, rate, and progress bar

**Steps:**
1. Log in as admin, wait for dashboard to load

**Expected:**
- Each branch card shows:
  - Branch full name
  - "X students" subtitle
  - Attendance rate percentage (e.g. "87%") in branch color
  - Colored progress bar filled to that percentage
  - Four mini status buttons (Present / Late / Absent / Holiday)

---

## TC-DB-16 — Click branch status button opens branch-filtered drilldown

**Steps:**
1. Click "Present" mini button on the "Sentul" branch card

**Expected:**
- "Present" tile in totals grid becomes active
- Drilldown header: "Present · Sentul"
- List shows only Present students from Sentul branch

---

## TC-DB-17 — Click same branch status button again closes drilldown

**Steps:**
1. Click a branch status button to open drilldown
2. Click the same branch status button again

**Expected:**
- Drilldown closes
- Button returns to inactive state

---

## TC-DB-18 — No data state for new day

**Steps:**
1. View dashboard on a day where no attendance has been recorded

**Expected:**
- All four totals show 0
- Branch cards section shows "No data yet for today"

---

## Regression Notes

- **Override does NOT delete then re-insert** — it updates the existing attendance row in place. The summary refresh calls `getDailySummary()` again; a brief flash between old and new totals is expected.
- **Teacher filter applied at hook level** — `useDashboard` filters `summary` array by branch name after fetching. If a teacher's `session.branches.name` is stale, they may see no data. Re-login fixes it.
- **Drilldown spinner uses active status color** — if the status changes while the spinner is showing (edge case), the spinner color may briefly mismatch.
