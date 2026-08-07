# Testing — utils module

Covers `lib/utils/date.js` (`getMYT`, `getMYTDaysAgo`) and the four hooks updated to use them: `useHolidays`, `useReports`, `useFees`, `useManualReceipt`.

---

## TC-U-01 — getMYT returns today's date in YYYY-MM-DD using local time

**Setup:** Call `getMYT()`.  
**Expected:** Returns a string matching `/^\d{4}-\d{2}-\d{2}$/` equal to today's local date.

---

## TC-U-02 — getMYT does not return UTC date at midnight MYT

**Setup:** Simulate 12:30 AM MYT (which is 4:30 PM UTC previous day).  
**Steps:** Call `getMYT()`.  
**Expected:** Returns the MYT calendar date (today), not the UTC date (yesterday). Contrast: `new Date().toISOString().split('T')[0]` would return yesterday here.

---

## TC-U-03 — getMYTDaysAgo(6) returns 6 days before today in local time

**Setup:** Call `getMYTDaysAgo(6)`.  
**Expected:** Returns a date string exactly 6 days before `getMYT()`, in `YYYY-MM-DD` format.

---

## TC-U-04 — Reports default date range is last 7 days in local time

**Setup:** Open the Reports page without changing any filters.  
**Steps:** Observe the pre-filled Start Date and End Date inputs.  
**Expected:** Start Date = 6 days ago (local time), End Date = today (local time). Neither date is the UTC equivalent that differs at midnight MYT.

---

## TC-U-05 — Holidays: active leave badge uses local date

**Setup:** Create a student leave record with today's MYT date as the start and end date.  
**Steps:** Go to Holidays → Student Leave tab at any time of day.  
**Expected:** The leave entry shows the **Active** badge — it does not incorrectly disappear at midnight MYT (which is 4 PM UTC) because the comparison uses local date, not UTC.

---

## TC-U-06 — Holidays: school closures auto-purge uses local date

**Setup:** Create a school closure with yesterday's local date.  
**Steps:** Reload the Holidays page.  
**Expected:** Yesterday's closure is purged from the list on mount — it is correctly identified as past based on local date.

---

## TC-U-07 — Fees batch record: paid_date is today's local date

**Setup:** In Fees, select multiple unpaid students and click "Record N payments" without changing the date.  
**Steps:** After recording, view one of the created payments.  
**Expected:** `paid_date` is today's date in MYT (local), not yesterday's UTC date which would be wrong at midnight MYT.

---

## TC-U-08 — Manual Receipt: default paid_date is today's local date

**Setup:** Open Manual Receipt → start a new receipt.  
**Steps:** Observe the Paid Date field default.  
**Expected:** Pre-filled with today's local date (YYYY-MM-DD), matching `getMYT()`.

---

## TC-U-09 — Manual Receipt: reset form restores today's local date

**Setup:** Change the paid date to a past date, then click "Reset" or start a new receipt.  
**Steps:** Observe the Paid Date field after reset.  
**Expected:** Returns to today's local date, not a stale or UTC date.

---

## TC-U-10 — No `toISOString().split('T')[0]` pattern remains in hooks

**Setup:** Search all files in `src/hooks/` for the string `toISOString().split('T')[0]`.  
**Expected:** Zero matches.
