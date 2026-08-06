# Caterpillar Attendance — Codebase Audit

**Date:** 2026-08-06 | **Branch:** `cpcc-enhancement`

---

## 1. Routes & Page Responsibilities

| Route | Component | Responsibility | Auth |
|---|---|---|---|
| `/` | — | Redirect → `/scanner` | Protected |
| `/scanner` | `Scanner.jsx` | QR camera + manual attendance marking; daily absent-marking trigger; branch/event filters | Teacher+ |
| `/dashboard` | `Dashboard.jsx` | Daily summary grid per branch; status drill-down; admin status override; event-mode trigger | Teacher+ |
| `/students` | `Students.jsx` | Student CRUD; QR generation & batch print; Telegram link copy; today's attendance filter | Teacher+ |
| `/holidays` | `Holidays.jsx` | Student leave records; school-wide closure calendar | Teacher+ |
| `/events` | `Events.jsx` | Special events with branch + age-group targeting | Teacher+ |
| `/admin` | `Admin.jsx` | Navigation hub to the 5 admin sub-tools | Admin+ |
| `/reports` | `Reports.jsx` | Date-range attendance query; CSV + PDF export | Admin+ |
| `/fees` | `Fees.jsx` | Fee payment recording; Telegram receipt delivery; paid/unpaid summary | Admin+ |
| `/import` | `Importer.jsx` | Bulk CSV import for students + initial fees | Admin+ |
| `/manual-receipt` | `ManualReceipt.jsx` | Multi-month receipt generation + print + Telegram send | Admin+ |
| `/manage-users` | `ManageUsers.jsx` | Password reset for teacher accounts | Admin+ |
| `/receipt/:id` | `Receipt.jsx` | Public printable receipt view (no auth) | Public |
| *(conditional)* | `ChangePassword.jsx` | Forced password change on first login | Session flag |

---

## 2. Components — Data-Fetching & Business Logic Audit

**Key:** `DB` = direct Supabase call, `BL` = business/validation logic in component body, `DC` = date/attendance calculations inline

### Heavily Mixed (all three concerns in one file)

| Component | Lines | DB | BL | DC | Notes |
|---|---|---|---|---|---|
| `Scanner.jsx` | 576 | ✓ | ✓ | ✓ | Camera setup, QR decoding, attendance upsert logic, MYT date calc, vibration API, event eligibility filter — all inline |
| `Fees.jsx` | 603 | ✓ | ✓ | ✓ | Payment creation, Telegram message composition, inline HTML receipt template, bot token hardcoded, paid/unpaid grouping |
| `ManualReceipt.jsx` | 605 | ✓ | ✓ | ✓ | Near-duplicate of Fees; receipt HTML template copy-pasted; month ordering, multi-month loop logic all inline |
| `Students.jsx` | 666 | ✓ | ✓ | ✓ | Auto student-no generation, QR generation, batch HTML print layout, attendance filter join — all inline |
| `Dashboard.jsx` | 361 | ✓ | ✓ | ✓ | Summary aggregation, branch filtering, event-mode eligibility check, admin override — inline |
| `Holidays.jsx` | 368 | ✓ | ✓ | ✓ | Date-range active/upcoming logic, auto-purge of past closures on mount — inline |

### Moderately Mixed

| Component | Lines | DB | BL | DC | Notes |
|---|---|---|---|---|---|
| `Reports.jsx` | 277 | ✓ | ✓ | — | CSV/PDF generation, grouping-by-date logic inline; no dedicated calculation layer |
| `Events.jsx` | 279 | ✓ | ✓ | ✓ | Today/upcoming/past badge logic inline; multi-select state inline |
| `Login.jsx` | 140 | ✓ | ✓ | — | Role check before password entry, session construction inline; **plain-text password query** |
| `ManageUsers.jsx` | 170 | ✓ | ✓ | — | Permission model (admin vs superadmin scoping) implemented inline |
| `ChangePassword.jsx` | 95 | ✓ | ✓ | — | Min-length + match validation inline |
| `Importer.jsx` | 251 | ✓ | ✓ | — | CSV parse + row validation + branch/age-group whitelist all inline |
| `Receipt.jsx` | 228 | ✓ | — | — | Mostly presentational; fetches own data via `useParams` |

### Clean (no direct Supabase, minimal logic)

| Component | Lines | Notes |
|---|---|---|
| `Navbar.jsx` | 74 | Pure nav; sets CSS variable for height |
| `Admin.jsx` | 81 | Navigation hub only |
| `useLanguage.js` | 96 | i18n translations only |

---

## 3. Duplicated Logic

### A. Supabase Query Copy-Paste

| Pattern | Appears in |
|---|---|
| `supabase.from('branches').select(...).order('name')` | Scanner, Students, Holidays, Events, Reports, Fees, ManualReceipt **(7×)** |
| `supabase.from('students').select('*, branches(...), parents(...)')` | Scanner, Students, Holidays, Fees, ManualReceipt **(5×)** |
| `supabase.from('attendance').select(...).eq('date', today)` | Scanner, Dashboard, Students **(3×)** |
| `supabase.from('parents').select('telegram_chat_id').eq('student_id', ...)` | Fees, ManualReceipt **(2×)** |
| `supabase.from('payments').select('*, students(...)').order('created_at')` | Fees, ManualReceipt **(2×)** |

### B. Receipt HTML Template

`generateReceiptHTML(payment, baseUrl)` — a 100+ line HTML template string — is **copy-pasted verbatim** between `Fees.jsx` and `ManualReceipt.jsx`.

### C. Telegram Message Composition

Identical message template strings and inline keyboard construction appear in `Fees.jsx` and `ManualReceipt.jsx`. The bot token `8728256755:AAH...` is hardcoded in **4 places** across those two files.

### D. Date/Today Derivation Inconsistency

- `Scanner.jsx` derives "today" with a Malaysia UTC+8 correction: `new Date(Date.now() + 8 * 60 * 60 * 1000)`
- Every other component uses `new Date().toISOString().split('T')[0]` (UTC, could give wrong date at midnight in MYT)

### E. Inline UI Boilerplate

| Pattern | Count |
|---|---|
| Inline `inp` style object (`{ width: '100%', background: 'var(--bg)', ... }`) | 8 components |
| Fixed bottom-sheet modal overlay (`position: fixed, inset: 0, alignItems: flex-end`) | 9 modal instances |
| Spinning loading indicator (inline keyframe animation) | 6 components |
| `STATUS = { PRESENT: {...}, LATE: {...}, ABSENT: {...}, HOLIDAY: {...} }` object | 2 components (different color schemas) |

### F. Repeated Attendance Status Object

`Dashboard.jsx` and `Reports.jsx` each define their own `STATUS` mapping with different color/background values. Neither shares a common source.

---

## 4. Mobile-Specific Assumptions

### Explicit Mobile Locking

- **`index.html`**: `maximum-scale=1.0, user-scalable=no` — disables pinch-to-zoom; desktop users cannot zoom the app.
- **`manifest.json`**: `display: standalone`, `orientation: portrait` — app is designed as portrait-only PWA.
- **Apple-specific meta tags**: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`.

### Mobile-Only APIs

| API | File | Notes |
|---|---|---|
| `navigator.mediaDevices.getUserMedia()` | `Scanner.jsx` | Camera access for QR. Falls back through `['environment', 'user']` facing modes. |
| `navigator.vibrate(40)` | `Scanner.jsx` | Haptic feedback on scan success. Silent on desktop. |
| `navigator.clipboard.writeText()` | `Students.jsx` | Telegram link copy. |
| `window.print()` | Receipt, Reports, Students, Fees, ManualReceipt | Print dialog; functional on desktop too but receipt layout is A4-targetted. |
| `localStorage` | `auth.js` | Session storage; works everywhere but designed around daily-expiry mobile session pattern. |

### Layout Assumptions

- No hardcoded pixel widths for component containers (uses flexbox throughout).
- Modal `max-width: 320–360px` — sized for phone screens; on a wide desktop these appear narrow.
- Bottom-sheet modals (`alignItems: flex-end`) — thumb-reach design pattern for phones.
- No CSS breakpoints in React components (all inline styles); `guide.html` has a `@media (max-width: 980px)` breakpoint but that's a standalone HTML file.
- Button touch targets are not consistently 44px minimum (some are 8–10px padding buttons).

### No Geolocation / Sensor APIs

No `navigator.geolocation`, accelerometer, gyroscope, or microphone usage found.

---

## 5. Folder Structure: Declared vs. Reality

### Declared / Actual Structure
```
src/
  components/    ← all 14 feature files live here, no sub-folders
  hooks/         ← only useLanguage.js (single file)
  lib/           ← supabase.js (Supabase client + 13 helper functions)
                    auth.js (localStorage session helpers)
  main.jsx
  App.jsx
  index.css
```

### What's Actually Happening vs. What the Structure Implies

| Implied separation | Reality |
|---|---|
| `components/` should hold presentational components | Most files are full feature modules (fetch + logic + UI combined) |
| `lib/supabase.js` implies a data access layer | Only ~6 of 13 functions in `lib/supabase.js` are used; most components bypass it and call `supabase.from()` directly |
| `hooks/` implies shared stateful logic | Only one hook exists; no extraction of repeated `useState`/`useEffect` patterns from components |
| No `pages/` directory | Route-level components live alongside small sub-components in `components/` with no distinction |
| No `utils/` or `constants/` directory | Date functions, STATUS maps, branch slug lists, and age-group lists are scattered inline |
| No `services/` or API layer | Telegram API calls (including bot token) are made directly from component `useEffect` callbacks |

---

## 6. Messiness Ranking (Refactor Priority)

**Scale:** 1 = clean, 5 = most urgent to refactor

| Rank | Component | Score | Primary Reasons |
|---|---|---|---|
| 1 | `Fees.jsx` | **5/5** | 603 lines; receipt HTML template duplicated from ManualReceipt; Telegram token hardcoded 2×; payment logic, UI, Telegram send, and print all in one file; no separation of concerns at all |
| 2 | `ManualReceipt.jsx` | **5/5** | 605 lines; near-identical to Fees.jsx; copy-pasted receipt template, copy-pasted Telegram logic; hardcoded token 2×; hardcoded receipt domain |
| 3 | `Scanner.jsx` | **5/5** | 576 lines; camera lifecycle management, QR decoding, attendance upsert, event-mode filtering, MYT date logic, vibration API, and admin "run cron" button all tangled together; inconsistent date derivation vs rest of app |
| 4 | `Students.jsx` | **4/5** | 666 lines; QR generation, batch print HTML, auto student-no algorithm, Telegram link, and multi-dimensional filter state all inline; longest file in codebase |
| 5 | `Dashboard.jsx` | **4/5** | 361 lines; duplicate STATUS object; event-mode eligible-student filtering re-implemented (also in Scanner); admin override UI embedded |
| 6 | `Holidays.jsx` | **3/5** | Auto-purge on mount is a side-effect smell; date comparison logic inline; two-tab UI driving two very different data shapes in one component |
| 7 | `Reports.jsx` | **3/5** | CSV/PDF generation inline; duplicate STATUS object; acceptable size but no extraction of export logic |
| 8 | `Login.jsx` | **3/5** | Plain-text password query is a security smell; role-check before password entry adds branching logic that belongs in auth layer |
| 9 | `Events.jsx` | **2/5** | Reasonably sized; event eligibility logic (age_groups + branches arrays) duplicated in Scanner/Dashboard rather than owned here |
| 10 | `Importer.jsx` | **2/5** | Branch slug & age-group whitelists hardcoded as arrays rather than from DB; otherwise self-contained |
| 11 | `ManageUsers.jsx` | **2/5** | Inline permission scoping (admin vs superadmin) could be a hook; acceptable otherwise |
| 12 | `ChangePassword.jsx` | **1/5** | Small, focused, does one thing |
| 13 | `Receipt.jsx` | **1/5** | Public view, fetches own data, mostly presentational |
| 14 | `Admin.jsx` | **1/5** | Navigation hub only |
| 15 | `Navbar.jsx` | **1/5** | Clean; one CSS variable side-effect |

### Cross-Cutting Issues (not tied to a single file)

| Issue | Severity |
|---|---|
| Telegram bot token hardcoded in 4 component locations | Critical |
| Plain-text passwords stored and queried in DB | Critical |
| `today` date derived inconsistently (MYT-aware in Scanner, UTC elsewhere) | High |
| No shared data-access layer — `supabase.from()` called directly in 10+ components | High |
| Receipt HTML template duplicated across 2 files | Medium |
| STATUS color map duplicated with diverging values | Medium |
| Input/modal/spinner UI boilerplate repeated in 6–9 places | Medium |
| `lib/supabase.js` helper functions bypassed in favor of inline queries | Low |
