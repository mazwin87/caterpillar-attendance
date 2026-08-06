# Manual Receipt — Test Cases

**Module:** `manual-receipt`  
**Route:** `/admin/manual-receipt`  
**Last verified:** 2026-08-06

---

## Preconditions

- Logged in as admin or superadmin
- At least one branch with at least one student exists
- At least one student has `monthly_fee` set
- Parent's Telegram chat ID linked to a student (for TC-MR-20 through TC-MR-22)

---

## TC-MR-01 — Page loads with empty form

**Steps:**
1. Navigate to `/admin/manual-receipt`

**Expected:**
- Header shows "Manual Receipt Generator"
- Form is visible (branch dropdown, month grid, payment details)
- Branch and student dropdowns show "Select branch" / "Select student"
- No months are pre-selected
- Year defaults to current year
- Amount field is empty
- Payment method defaults to "Cash"
- Date defaults to today
- Generate button is disabled

---

## TC-MR-02 — Branch selection filters student list

**Steps:**
1. Select a specific branch from the branch dropdown

**Expected:**
- Student dropdown only shows students belonging to that branch
- Student dropdown resets to "Select student"
- Amount field is cleared

---

## TC-MR-03 — Student selection pre-fills monthly fee

**Steps:**
1. Select a branch
2. Select a student that has `monthly_fee` set

**Expected:**
- Amount field is pre-filled with the student's `monthly_fee`
- A green info banner appears: "Monthly fee: RM X.XX"

---

## TC-MR-04 — Student with no monthly_fee leaves amount empty

**Steps:**
1. Select a branch
2. Select a student with no `monthly_fee` (null/0)

**Expected:**
- Amount field is empty or shows 0
- No monthly fee banner appears (or shows RM 0.00)

---

## TC-MR-05 — Toggle individual months on/off

**Steps:**
1. Select a student
2. Click "Jan" in the month grid
3. Click "Jan" again

**Expected:**
- First click: Jan button turns green; "1 selected" badge appears
- Second click: Jan button returns to default; badge disappears

---

## TC-MR-06 — Select all months

**Steps:**
1. Click "Select all"

**Expected:**
- All 12 month buttons turn green
- Badge shows "12 selected"
- Button label changes to "Deselect all"

---

## TC-MR-07 — Deselect all months

**Steps:**
1. Click "Select all" to select all 12 months
2. Click "Deselect all"

**Expected:**
- All month buttons revert to default
- Badge disappears
- Button label changes back to "Select all"

---

## TC-MR-08 — Year selector changes year

**Steps:**
1. Change year dropdown from current year to 2024

**Expected:**
- Year dropdown reflects 2024
- Selected months do not change

---

## TC-MR-09 — Pre-generate summary card appears when ready

**Steps:**
1. Select a student
2. Select 3 months (e.g. Jan, Feb, Mar)
3. Enter an amount (e.g. 150)
4. Confirm payment method is set

**Expected:**
- Green summary card appears below payment section:
  - Student name with 👦
  - "Jan, Feb, Mar 2025" with 📅
  - "RM 150.00 × 3 = RM 450.00" with 💰
  - Payment method with 💳
- Generate button is enabled

---

## TC-MR-10 — Multi-month total shown in payment section

**Steps:**
1. Select 2 months
2. Enter amount 150

**Expected:**
- Below amount input: "Total: RM 300.00 for 2 months"

---

## TC-MR-11 — Generate button disabled when form incomplete

| Scenario | Expected |
|---|---|
| No student selected | Button disabled |
| No months selected | Button disabled |
| No amount | Button disabled |
| All filled | Button enabled |

---

## TC-MR-12 — Generate single receipt

**Steps:**
1. Select student, select 1 month, enter amount, confirm payment method and date
2. Click Generate & Print button

**Expected:**
- Button shows "Generating 1 receipts..." while processing
- Print window opens with the receipt layout
- Results view replaces the form:
  - Green success banner: "✅ 1 receipt generated!"
  - One row showing month, year, receipt_no, payment_method, amount
  - 🔗 button in the row
  - Total collected row

---

## TC-MR-13 — Generate multiple receipts

**Steps:**
1. Select student, select 3 months, enter amount
2. Click Generate & Print

**Expected:**
- Button shows "Generating 3 receipts..."
- Print window opens with all 3 receipts, one per printed page
- Results view shows 3 rows sorted chronologically (Jan before Feb before Mar)
- Total collected = amount × 3
- Header: "✅ 3 receipts generated!"
- Send button: "📱 Send 3 Receipts via Telegram"

---

## TC-MR-14 — Receipt rows sorted chronologically in results

**Steps:**
1. Select months in reverse order: Dec, Jan, Mar
2. Generate

**Expected:**
- Results list shows rows in order: Jan, Mar, Dec (by calendar position)

---

## TC-MR-15 — 🔗 button opens receipt page in new tab

**Steps:**
1. Generate a receipt
2. Click 🔗 next to a receipt row

**Expected:**
- New tab opens at `/receipt/<payment_id>`
- Page shows the receipt for that payment

---

## TC-MR-16 — Payment method selector (Cash / Bank Transfer / Cheque)

**Steps:**
1. In payment details, click "Bank Transfer"

**Expected:**
- "Bank Transfer" button turns green (active state)
- "Cash" button reverts to default
- Generated receipt reflects "Bank Transfer" as payment method

---

## TC-MR-17 — Custom payment date

**Steps:**
1. Set paid date to 2025-01-15
2. Generate receipt

**Expected:**
- Generated payment record has `paid_date = 2025-01-15`
- Receipt shows this date

---

## TC-MR-18 — "Generate another" resets form

**Steps:**
1. Generate at least one receipt (results view is now showing)
2. Click "Generate another"

**Expected:**
- Form resets completely: no student, no months, empty amount, Cash, today's date
- Results view is hidden; form is shown again

---

## TC-MR-19 — Error on one month does not block others

**Steps:**
1. Select 3 months; simulate a DB error for the second month (e.g. duplicate receipt)
2. Click Generate

**Expected:**
- Alert shown for the failing month
- Other months succeed
- Results view shows only the successful receipts

---

## TC-MR-20 — Send receipts via Telegram (parent linked)

**Steps:**
1. Select a student whose parent has a Telegram ID linked
2. Generate 2 receipts
3. Click "📱 Send 2 Receipts via Telegram"

**Expected:**
- Button shows "Sending..." while in progress
- Alert: "✅ 2 receipts sent to parent via Telegram!"
- Telegram message received by parent lists both months, total, and inline keyboard with 2 buttons (one per receipt)

---

## TC-MR-21 — Telegram send fails gracefully (parent not linked)

**Steps:**
1. Select a student with no parent Telegram ID
2. Generate a receipt
3. Click "Send via Telegram"

**Expected:**
- Error alert shown with descriptive message
- Button returns to enabled state

---

## TC-MR-22 — Telegram send button disabled while sending

**Steps:**
1. Generate receipts for a linked student
2. Click send; immediately observe button state

**Expected:**
- Button is visually dimmed (opacity 0.6) while sending
- Clicking again does nothing (button disabled state)

---

## TC-MR-23 — Print window content (single receipt)

**Steps:**
1. Generate 1 receipt and observe the print window

**Expected:**
- Print window contains receipt with:
  - School name/logo area
  - Student name and student number
  - Month, year, and payment year
  - Receipt number
  - Amount (RM format)
  - Payment method
  - Paid date
  - Month checkboxes with the paid month checked

---

## TC-MR-24 — Print window content (multi-receipt)

**Steps:**
1. Generate 3 receipts and observe the print window

**Expected:**
- Print window contains 3 receipt blocks
- Each block separated by `page-break-after: always` (each prints on its own page)
- Each block has its own month checked in the month checkboxes

---

## Regression Notes

- **Form does not close after generate** — unlike the fees single-payment modal, this is a page-level form. After generating, the results view replaces the form inline. "Generate another" is the only reset path.
- **Telegram sends all months in one message** — not one message per receipt. The Telegram message lists months and a total; inline keyboard has one button per receipt linking to the receipt page.
- **Print opens immediately on generate** — the print window opens before the results view is shown. If the user cancels the print dialog, the results view still appears correctly.
- **Bot token is currently client-side** — visible in browser devtools. Tracked for fix in the `telegram` module refactor.

---

## Known Limitations

- Receipt origin (`nimonimo.tech`) is hardcoded in `src/lib/services/manual-receipt.service.js`. Telegram receipt buttons will point to the production URL even in local dev.
- Bot token is duplicated between `fees.service.js` and `manual-receipt.service.js`. Will be consolidated when the `telegram` module is refactored.
- Year selector is limited to 2024–2027. Extend `MonthSelector.jsx` if needed.
