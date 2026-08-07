# Testing — importer module

Covers `lib/services/importer.service.js` and `components/features/importer/ImporterPage.jsx`.

---

## TC-I-01 — Download template produces a valid CSV

**Setup:** Open Admin → Importer page.  
**Steps:** Click "Download CSV Template".  
**Expected:** A file named `students_import_template.csv` downloads. Opening it shows a header row and 3 example rows with the correct columns.

---

## TC-I-02 — Valid CSV with no fee history parses without errors

**Setup:** Prepare a CSV with required fields only (no fee_month/year/amount).  
**Steps:** Upload the file.  
**Expected:** No validation errors; preview shows N records ready to import.

---

## TC-I-03 — Valid CSV with fee history parses without errors

**Setup:** Prepare a CSV with all required fields plus fee_month, fee_year, fee_amount, fee_payment_method, fee_paid_date.  
**Steps:** Upload the file.  
**Expected:** Preview shows the correct count. Fee badge appears on rows with fee data.

---

## TC-I-04 — Invalid branch_slug shows error

**Setup:** CSV row with `branch_slug = FAKE`.  
**Steps:** Upload.  
**Expected:** Error shown: `branch_slug "FAKE" is invalid`. Import button is not shown.

---

## TC-I-05 — All valid branch slugs accepted (KLTS, SNTL, WGMJ, MXIM)

**Setup:** CSV with four rows, one per valid slug.  
**Steps:** Upload.  
**Expected:** No branch validation errors.

---

## TC-I-06 — Invalid age_group shows error

**Setup:** CSV row with `age_group = toddler` (not in the valid list).  
**Steps:** Upload.  
**Expected:** Error: `age_group "toddler" is invalid`.

---

## TC-I-07 — Invalid date_of_birth format shows error

**Setup:** CSV row with `date_of_birth = 15/03/2021` (wrong format).  
**Steps:** Upload.  
**Expected:** Error: `date_of_birth must be YYYY-MM-DD format`.

---

## TC-I-08 — Invalid fee_payment_method shows error

**Setup:** CSV row with `fee_payment_method = PayNow`.  
**Steps:** Upload.  
**Expected:** Error: `fee_payment_method must be Cash, Bank Transfer or Cheque`.

---

## TC-I-09 — Missing required field shows error

**Setup:** CSV row missing `parent_phone`.  
**Steps:** Upload.  
**Expected:** Error: `parent_phone is required`.

---

## TC-I-10 — Preview shows at most 6 rows, remainder count shown

**Setup:** CSV with 10 valid rows.  
**Steps:** Upload.  
**Expected:** Preview shows 6 rows and a line "...and 4 more".

---

## TC-I-11 — Import button only appears after error-free parse

**Setup:** Upload a CSV with validation errors.  
**Expected:** Import button is not visible.  
**Then:** Fix the CSV and re-upload.  
**Expected:** Import button appears.

---

## TC-I-12 — Successful import shows success count

**Setup:** Upload and import a valid 2-row CSV.  
**Expected:** Results panel shows "✅ 2 records imported successfully".

---

## TC-I-13 — Failed rows shown in results panel

**Setup:** One row has a duplicate `student_no` (DB constraint violation).  
**Steps:** Upload valid CSV, click Import.  
**Expected:** Failed row appears in the error list with student_no and reason.

---

## TC-I-14 — Import another file resets the form

**Setup:** After a successful import, click "Import another file".  
**Expected:** Form resets: no preview, no errors, file input cleared, ready to accept a new CSV.

---

## TC-I-15 — Fee paid_date defaults to today's MYT date when omitted

**Setup:** CSV row with fee data but no `fee_paid_date` column.  
**Steps:** Import.  
**Expected:** Created payment record's `paid_date` equals today's local date (MYT), not a UTC date that could be yesterday at midnight MYT.

---

## TC-I-16 — Importer.jsx is a re-export shim

**Setup:** Inspect `src/components/Importer.jsx`.  
**Expected:** File contains only `export { default } from './features/importer/ImporterPage'`. All logic lives in the service and feature directory.
