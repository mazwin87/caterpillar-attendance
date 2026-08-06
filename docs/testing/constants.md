# Testing — constants module

Covers `lib/constants/branches.js`, `lib/constants/attendance.js`, `lib/constants/ageGroups.js`, `lib/constants/months.js` and all consumer files updated to import from them.

---

## TC-C-01 — shortBranchName strips the prefix correctly

**Setup:** Import `shortBranchName` from `lib/constants/branches`.  
**Steps:** Call with `'Caterpillar Playtime Sentul'`.  
**Expected:** Returns `'Sentul'`.

---

## TC-C-02 — shortBranchName handles null / undefined

**Setup:** Import `shortBranchName`.  
**Steps:** Call with `undefined`, then `null`, then `''`.  
**Expected:** All return `''` without throwing.

---

## TC-C-03 — shortBranchName handles a name without the prefix

**Setup:** Import `shortBranchName`.  
**Steps:** Call with `'Unknown Branch'`.  
**Expected:** Returns `'Unknown Branch'` (string unchanged).

---

## TC-C-04 — BRANCH_SLUGS contains all four locations

**Setup:** Import `BRANCH_SLUGS` from `lib/constants/branches`.  
**Steps:** Check contents.  
**Expected:** Array equals `['KLTS', 'SNTL', 'WGMJ', 'MXIM']`.

---

## TC-C-05 — Importer validates against BRANCH_SLUGS

**Setup:** Open the Importer page. Upload a CSV where one row has `branch_slug = FAKE`.  
**Expected:** Validation error shown: `branch_slug "FAKE" is invalid`.

---

## TC-C-06 — Importer accepts all valid branch slugs

**Setup:** Upload a CSV with one row per valid slug (KLTS, SNTL, WGMJ, MXIM).  
**Expected:** No validation error; preview shows 4 records ready to import.

---

## TC-C-07 — Reports table shows short branch name

**Setup:** Run a report covering a date range with records from multiple branches.  
**Steps:** Inspect each row in the AttendanceTable.  
**Expected:** Branch column shows e.g. `'Sentul'`, not `'Caterpillar Playtime Sentul'` and not `'Caterpillar_Sentul'`.

---

## TC-C-08 — QR batch print shows short branch name

**Setup:** Go to Students, select a student from any branch, click Print QR (batch).  
**Steps:** Inspect the print preview that opens.  
**Expected:** Each card's branch line shows the short name (e.g. `'KL Traders'`), not the full prefix.

---

## TC-C-09 — Manual attendance list shows short branch name

**Setup:** Open Scanner → Manual mode.  
**Steps:** Observe the sub-line beneath each student's name.  
**Expected:** Branch shows short form (e.g. `'Wangsa Maju'`), not `'Caterpillar Playtime Wangsa Maju'`.

---

## TC-C-10 — Student list shows short branch name

**Setup:** Go to Students page.  
**Steps:** Observe the meta line under each student card.  
**Expected:** Branch shows short form.

---

## TC-C-11 — Student leave list shows short branch name

**Setup:** Go to Holidays → Student Leave tab.  
**Steps:** Observe each leave entry.  
**Expected:** Branch shows short form, not full name and not a `'Caterpillar_'` variant.

---

## TC-C-12 — Dashboard branch grid shows short branch name

**Setup:** Go to Dashboard.  
**Steps:** Observe branch summary cards.  
**Expected:** Card headers show short names (`'KL Traders'`, `'Sentul'`, etc.).

---

## TC-C-13 — PDF export shows correct short branch name

**Setup:** Run a report, click Export PDF.  
**Steps:** Open the print preview and inspect the Branch column.  
**Expected:** Branch column shows short form consistently for all rows.

---

## TC-C-14 — CSV export shows correct short branch name

**Setup:** Run a report, click Export CSV. Open the file in a text editor.  
**Expected:** `Branch` column contains short names only (no `'Caterpillar Playtime '` prefix, no `'Caterpillar_'` variant).

---

## TC-C-15 — STATUS constant used by AttendanceTable

**Setup:** Run a report that includes PRESENT, LATE, ABSENT, and HOLIDAY records.  
**Steps:** Inspect status badges in AttendanceTable.  
**Expected:** Colors match the shared STATUS constant (green for PRESENT, amber for LATE, red for ABSENT, blue for HOLIDAY) — same colors as Dashboard and Scanner.

---

## TC-C-16 — No `replace('Caterpillar_', '')` left in codebase

**Setup:** Run a text search across all `.jsx`/`.js` files for `'Caterpillar_'`.  
**Expected:** Zero matches.
