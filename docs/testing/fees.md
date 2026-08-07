# Fees Module — Test Documentation

**Module short name:** `fees`  
**Route:** `/fees`  
**Component entry:** `src/components/Fees.jsx` → `src/components/features/fees/FeesPage.jsx`  
**Last tested:** —  
**Tester:** —

---

## Preconditions

Before running any test case:

1. Dev server is running: `npm run dev` → http://localhost:3000/cpcc/
2. Logged in as a user with **admin** or **superadmin** role (fees route requires admin+)
3. At least one branch exists with active students
4. At least one student has a `monthly_fee` set
5. At least one parent has a Telegram `chat_id` linked (for TG tests)
6. Network tab is open in DevTools to catch failed Supabase requests

---

## Test Cases

### TC-F-01 — Page load

| Field | Detail |
|---|---|
| **What** | Fees page loads its initial data without errors |
| **Steps** | 1. Navigate to `/fees` |
| **Expected** | Branch dropdown populated; current month and year pre-selected; student list visible (or empty-state if no branch); no console errors |
| **Status** | — |

---

### TC-F-02 — Branch filter resets state

| Field | Detail |
|---|---|
| **What** | Switching branch clears selection and status filter |
| **Steps** | 1. Select a branch → select 2 unpaid students → click Paid summary card to activate status filter → change branch in dropdown |
| **Expected** | Selected students deselected; status filter cleared (all students shown for new branch) |
| **Status** | — |

---

### TC-F-03 — Month / year filter resets state

| Field | Detail |
|---|---|
| **What** | Changing month or year clears selection and status filter |
| **Steps** | 1. Select a branch → select students → change month dropdown |
| **Expected** | Selection cleared; status filter cleared; paid/unpaid counts update for new month |
| **Status** | — |

---

### TC-F-04 — Summary cards — counts

| Field | Detail |
|---|---|
| **What** | Paid / Unpaid / Collected figures are correct |
| **Steps** | 1. Select a branch and month with known payment data → observe the three summary cards |
| **Expected** | Paid count = number of students with a payment record for that branch/month/year; Unpaid = rest; Collected RM = sum of `amount` for paid students |
| **Status** | — |

---

### TC-F-05 — Summary cards — toggle filter

| Field | Detail |
|---|---|
| **What** | Clicking Paid / Unpaid cards filters the list; clicking again clears |
| **Steps** | 1. Click **Paid** card → observe list → click **Paid** card again |
| **Expected** | First click: only paid students shown, card turns solid green; Second click: all students shown, card returns to light green |
| **Steps (repeat)** | Same for **Unpaid** card (solid red / light red) |
| **Status** | — |

---

### TC-F-06 — Select all unpaid

| Field | Detail |
|---|---|
| **What** | "Select all" button toggles all unpaid students in the current view |
| **Steps** | 1. Select a branch with multiple unpaid students → click **Select all** → click **Select all** again |
| **Expected** | First click: all unpaid row borders turn green, batch toolbar appears showing correct count; Second click: all deselected, toolbar disappears |
| **Status** | — |

---

### TC-F-07 — Individual checkbox toggle

| Field | Detail |
|---|---|
| **What** | Tapping a single student checkbox adds / removes them from selection |
| **Steps** | 1. Click checkbox on one unpaid student → click it again |
| **Expected** | First click: row turns green, count in toolbar shows 1; Second click: row returns to default, toolbar disappears |
| **Status** | — |

---

### TC-F-08 — Clear selection with × button

| Field | Detail |
|---|---|
| **What** | × button in batch toolbar clears all selections |
| **Steps** | 1. Select any unpaid students → click **×** in the toolbar |
| **Expected** | All rows deselected; batch toolbar disappears |
| **Status** | — |

---

### TC-F-09 — Batch record (no Telegram)

| Field | Detail |
|---|---|
| **What** | Recording payments for multiple students in one action |
| **Steps** | 1. Select 2+ unpaid students → ensure TG checkbox is **OFF** → click **Record N payments** → confirm the dialog |
| **Expected** | Browser confirm dialog appears with correct count; after confirming, all selected students move to Paid section; success alert shows "✅ N payments recorded!"; selection cleared |
| **Status** | — |

---

### TC-F-10 — Batch record cancel

| Field | Detail |
|---|---|
| **What** | Cancelling the confirm dialog does not create any payments |
| **Steps** | 1. Select students → click **Record N payments** → click **Cancel** in the confirm dialog |
| **Expected** | No payments created; students remain in Unpaid section; selection stays intact |
| **Status** | — |

---

### TC-F-11 — Batch payment method selection

| Field | Detail |
|---|---|
| **What** | Payment method dropdown in toolbar is applied to all batch payments |
| **Steps** | 1. Select students → change method to **Bank Transfer** → record batch → check the paid rows |
| **Expected** | All newly created payments show "Bank Transfer" as the method in the receipt_no · method subtitle |
| **Status** | — |

---

### TC-F-12 — Batch record + send Telegram

| Field | Detail |
|---|---|
| **What** | Batch Telegram send fires for all parents with linked accounts |
| **Steps** | 1. Select students (mix of TG-linked and unlinked) → tick "Send receipt via Telegram to all selected parents" → record batch |
| **Expected** | Alert shows: payments recorded count, receipts sent count, failed count (for unlinked); Telegram messages arrive for linked parents |
| **Status** | — |

---

### TC-F-13 — Single record modal opens correctly

| Field | Detail |
|---|---|
| **What** | "Record" button opens the payment form with correct defaults |
| **Steps** | 1. Click **Record** on any unpaid student |
| **Expected** | Bottom-sheet modal slides up; header shows student name and current month/year; Amount pre-filled with student's `monthly_fee`; method defaults to Cash; date defaults to today |
| **Status** | — |

---

### TC-F-14 — Single record modal — close without saving

| Field | Detail |
|---|---|
| **What** | Closing the modal does not create a payment |
| **Steps** | 1. Open modal → click **Cancel** (or tap the dark backdrop) |
| **Expected** | Modal closes; student remains in Unpaid section |
| **Status** | — |

---

### TC-F-15 — Single record — save (no Telegram)

| Field | Detail |
|---|---|
| **What** | Saving a single payment moves the student to the Paid section |
| **Steps** | 1. Open modal → change amount if desired → choose method → pick date → ensure TG checkbox is **OFF** → click **Save** |
| **Expected** | Modal closes immediately; student appears in Paid section with correct receipt_no and method; no Telegram message sent |
| **Status** | — |

---

### TC-F-16 — Single record — save with Telegram

| Field | Detail |
|---|---|
| **What** | TG receipt is sent after modal closes |
| **Steps** | 1. Open modal for a student whose parent has Telegram linked → tick "Send receipt via Telegram" → Save |
| **Expected** | Modal closes first; Telegram receipt message arrives; success alert shows after message is sent |
| **Status** | — |

---

### TC-F-17 — Single record — custom amount

| Field | Detail |
|---|---|
| **What** | Amount field accepts a custom value |
| **Steps** | 1. Open modal → clear amount → type a different value → Save |
| **Expected** | Payment created with the custom amount; RM displayed on the paid row matches what was entered |
| **Status** | — |

---

### TC-F-18 — Print receipt

| Field | Detail |
|---|---|
| **What** | 🖨️ button opens a formatted receipt in a new window and triggers print dialog |
| **Steps** | 1. Click 🖨️ on any paid student row |
| **Expected** | New browser window/tab opens with the full receipt layout (logo, branch info, student name, month checkbox, amount, payment method); browser print dialog fires automatically |
| **Status** | — |

---

### TC-F-19 — Open receipt page

| Field | Detail |
|---|---|
| **What** | 🔗 button opens the public receipt view |
| **Steps** | 1. Click 🔗 on any paid student row |
| **Expected** | New tab opens at `/receipt/{id}`; receipt page loads with the correct payment details |
| **Status** | — |

---

### TC-F-20 — Send single Telegram receipt

| Field | Detail |
|---|---|
| **What** | 📱 button sends receipt to parent and shows feedback |
| **Steps** | 1. Click 📱 on a paid student whose parent has Telegram linked |
| **Expected** | Button shows `...` while in flight; Telegram message arrives with receipt link; success alert: "Receipt sent via Telegram! ✅" |
| **Status** | — |

---

### TC-F-21 — Send Telegram — no account linked

| Field | Detail |
|---|---|
| **What** | 📱 on a student with no Telegram linked shows a graceful error |
| **Steps** | 1. Click 📱 on a paid student whose parent has **no** `telegram_chat_id` |
| **Expected** | Alert: "Parent has no Telegram linked." — no crash, no unhandled promise |
| **Status** | — |

---

### TC-F-22 — Empty state: no branch selected

| Field | Detail |
|---|---|
| **What** | Correct message shown when no branch is selected and there are no students |
| **Steps** | 1. Clear the branch dropdown (select "All branches") on a fresh load where students exist only in specific branches |
| **Expected** | Message: "Select a branch to view students" |
| **Status** | — |

---

### TC-F-23 — Empty state: branch with no results

| Field | Detail |
|---|---|
| **What** | Correct message shown when a branch is selected but no students match the current filters |
| **Steps** | 1. Select a branch → switch status filter to "Paid" when no one in that branch has paid → observe |
| **Expected** | Message: "No students found" |
| **Status** | — |

---

### TC-F-24 — Spinner shown while loading

| Field | Detail |
|---|---|
| **What** | Loading spinner appears before data arrives |
| **Steps** | 1. Open DevTools → Network → set throttle to Slow 3G → navigate to `/fees` |
| **Expected** | Spinner visible in the student list area while Supabase requests are in flight; disappears once data loads |
| **Status** | — |

---

## Regression Notes

These behaviours existed before the refactor and must remain identical:

- Filter changes (branch/month/year) **always** reset selection AND status filter simultaneously
- Batch record fires `window.confirm()` — if the user cancels, nothing is written to the DB
- In single record flow, the modal closes **before** the Telegram message is sent (not after)
- The 🖨️ receipt uses `window.location.origin` as the logo base URL (logo loads only when served from the same origin)
- Batch TG sends count `failed++` for both "no Telegram linked" and actual API errors — they are not distinguished in the alert

---

## Known Limitations (pre-existing, not introduced by refactor)

- The Telegram bot token is still stored client-side in `src/lib/services/fees.service.js`. This is a pre-existing security issue tracked under the `telegram` module in `docs/plan.md`.
- The receipt link in Telegram messages points to `https://nimonimo.tech/receipt/{id}` (hardcoded origin) — not the current deployment URL.
- `window.open('/receipt/{id}')` does not include the Vite base path `/cpcc/` so the link may 404 depending on the deployment proxy config.
