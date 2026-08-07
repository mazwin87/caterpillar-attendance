# Testing — receipt module

Covers `lib/services/receipts.service.js`, `hooks/useReceipt.js`, and `components/features/receipt/PublicReceipt.jsx`.

---

## TC-RC-01 — Valid receipt URL renders the receipt

**Setup:** A payment record exists with a known ID.  
**Steps:** Navigate to `/receipt/<id>`.  
**Expected:** Receipt page renders with the correct student name, receipt number, amount, month checked, and payment method ticked.

---

## TC-RC-02 — Loading spinner shown while fetching

**Setup:** Navigate to a receipt URL.  
**Expected:** A spinner appears briefly before the receipt content is shown. No blank flash.

---

## TC-RC-03 — Not-found state for unknown ID

**Setup:** Navigate to `/receipt/00000000-0000-0000-0000-000000000000` (non-existent UUID).  
**Expected:** Page shows a "Receipt not found" message, not an error stack trace.

---

## TC-RC-04 — Receipt displays correct month checkbox

**Setup:** A payment exists for `month = 'April'`.  
**Steps:** Open the receipt page.  
**Expected:** The April checkbox is filled; all other month checkboxes are empty.

---

## TC-RC-05 — Receipt displays correct payment method checkbox

**Setup:** A payment exists with `payment_method = 'Bank Transfer'`.  
**Steps:** Open the receipt page.  
**Expected:** The "Bank Transfer" checkbox in the footer is ticked; "Cheque" and "Cash" are empty.

---

## TC-RC-06 — Receipt shows branch address and contact info

**Setup:** A payment exists where the student belongs to a branch with address, phone, website, email, and reg_no.  
**Steps:** Open the receipt page.  
**Expected:** All branch details appear in the header.

---

## TC-RC-07 — Print button triggers window.print()

**Setup:** Open any valid receipt page.  
**Steps:** Click "Print Receipt".  
**Expected:** Browser print dialog opens.

---

## TC-RC-08 — Print CSS hides the print button

**Setup:** Trigger print (or inspect `@media print` styles).  
**Expected:** The print button is not visible in the printed output.

---

## TC-RC-09 — MONTHS imported from constants, not inline

**Setup:** Inspect `src/components/features/receipt/PublicReceipt.jsx`.  
**Expected:** `MONTHS` is imported from `lib/constants/months` — no inline array definition in the file.

---

## TC-RC-10 — Receipt.jsx is a re-export shim

**Setup:** Inspect `src/components/Receipt.jsx`.  
**Expected:** File contains only `export { default } from './features/receipt/PublicReceipt'`.
