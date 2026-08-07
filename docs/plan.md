# Target Architecture Plan
**Project:** Caterpillar Attendance  
**Migration:** Vite + React 18 + React Router v6 → Next.js 14 (App Router)  
**Date drafted:** 2026-08-06  
**Status:** For review — no code written yet

---

## Module Checklist

Short names for use in future prompts. Ordered most messy → least messy (refactor priority).

| # | Short name | Messiness | Why it's messy | Current file(s) | Status |
|---|---|---|---|---|---|
| 1 | `fees` | ⭐⭐⭐⭐⭐ | 603 lines; payment logic, Telegram send, receipt HTML template, and print all in one file; bot token hardcoded 2×; receipt template copy-pasted from `manual-receipt` | `Fees.jsx` | [x] |
| 2 | `manual-receipt` | ⭐⭐⭐⭐⭐ | 605 lines; near-verbatim copy of `fees`; same bot token, same receipt template, same Telegram logic duplicated independently | `ManualReceipt.jsx` | [x] |
| 3 | `check-in` | ⭐⭐⭐⭐⭐ | 576 lines; camera lifecycle, QR decode, attendance upsert, event-mode eligibility filter, MYT date calc, vibration API, and admin cron trigger all tangled together | `Scanner.jsx` | [x] |
| 4 | `students` | ⭐⭐⭐⭐ | 666 lines (longest file); QR generation, batch print HTML, auto student-no algorithm, Telegram link, and multi-dimensional filter state all inline | `Students.jsx` | [x] |
| 5 | `dashboard` | ⭐⭐⭐⭐ | 361 lines; STATUS map duplicated with different colors from `reports`; event eligibility filter re-implemented (also lives in `check-in`) | `Dashboard.jsx` | [x] |
| 6 | `ui-primitives` | ⭐⭐⭐ | No shared component library exists; input style object, modal overlay, and loading spinner each copy-pasted 6–9× across all components | scattered inline | [x] |
| 7 | `holidays` | ⭐⭐⭐ | 368 lines; auto-purge of past closures fires on every mount; date comparison inline; two unrelated data shapes (leave + closures) forced into one component | `Holidays.jsx` | [x] |
| 8 | `reports` | ⭐⭐⭐ | 277 lines; STATUS map duplicated with different colors from `dashboard`; CSV/PDF generation and date-grouping logic all inline | `Reports.jsx` | [x] |
| 9 | `auth` | ⭐⭐⭐ | Plain-text password query inline in component; role-check before password entry adds branching that belongs in a service; session construction inline | `Login.jsx`, `ChangePassword.jsx`, `src/lib/auth.js` | [x] |
| 10 | `constants` | ⭐⭐⭐ | STATUS map defined twice with diverging colors; AGE_GROUPS and BRANCH_SLUGS each hardcoded as inline arrays in 3+ separate files | scattered inline | [x] |
| 11 | `utils` | ⭐⭐⭐ | `getMYT()` re-implemented 5× inconsistently — Scanner uses UTC+8 correction, everything else uses raw UTC; receipt HTML template duplicated across 2 files | scattered inline | [x] |
| 12 | `events` | ⭐⭐ | 279 lines; event eligibility logic (branch + age-group arrays) duplicated in `check-in` and `dashboard` instead of owned here | `Events.jsx` | [x] |
| 13 | `importer` | ⭐⭐ | 251 lines; branch slug + age-group whitelists hardcoded as inline arrays instead of imported from `constants` | `Importer.jsx` | [x] |
| 14 | `manage-users` | ⭐⭐ | 170 lines; admin vs superadmin permission scoping implemented inline; otherwise self-contained | `ManageUsers.jsx` | [x] |
| 15 | `telegram` | ⭐⭐ | Logic is isolated in Supabase edge functions; needs porting to Next.js Route Handlers and bot token needs to move to env var | `supabase/functions/notify_absent_parents/`, `supabase/functions/telegram_webhook/` | [ ] |
| 16 | `shells` | ⭐ | `Navbar.jsx` is clean (74 lines); just needs splitting into `MobileShell` / `DesktopShell` / `BottomNav` / `Sidebar` | `Navbar.jsx` | [ ] |
| 17 | `receipt` | ⭐ | 228 lines; mostly presentational; only change needed is moving the Supabase fetch to a hook | `Receipt.jsx` | [x] |

> **Usage:** reference these names in prompts, e.g. "refactor the `check-in` module", "add a service layer for `fees`", "build `ui-primitives` first".

---

## Guiding Principles

1. **Layer contract is a one-way dependency.** Each layer may only call the layer directly below it. UI never touches Supabase. Services never import React.
2. **Co-locate by feature inside layers, not by type across the codebase.** `lib/services/attendance.ts` not `lib/queries.ts` with everything in it.
3. **One date-truth.** A single `getMYT()` utility owns the Malaysia UTC+8 derivation. Every other file imports it; no more inline `Date.now() + 8 * 60 * 60 * 1000` scattered across components.
4. **One STATUS truth.** A single `lib/constants/attendance.ts` owns the status map, colors, and labels. Dashboard and Reports stop re-defining it with diverging values.
5. **Secrets stay server-side.** Telegram bot token moves to a Next.js Route Handler / Server Action. It never ships to the browser.
6. **Responsive = separate shells, shared logic.** `MobileShell` and `DesktopShell` consume the same hooks. No component has a thousand `sm:` classes and conditional renders based on viewport width.

---

## Layer Definitions & Contracts

```
┌─────────────────────────────────────────────────┐
│  app/  (route files)                            │
│  — thin; only composes feature components       │
│  — no useState, no Supabase, no business logic  │
├─────────────────────────────────────────────────┤
│  components/features/  (feature modules)        │
│  — consumes hooks + ui/ primitives              │
│  — no direct supabase.from() calls              │
│  — owns local UI state (modals, form fields)    │
├─────────────────────────────────────────────────┤
│  components/ui/  (primitives)                   │
│  — zero business logic, zero data fetching      │
│  — props-only, fully typed                      │
├─────────────────────────────────────────────────┤
│  hooks/  (data + state hooks)                   │
│  — calls lib/services, exposes typed state      │
│  — owns loading/error surface                   │
├─────────────────────────────────────────────────┤
│  lib/services/  (data access layer)             │
│  — all supabase.from() and supabase.rpc() calls │
│  — all Telegram API calls (server-side only)    │
│  — pure async functions, return typed data      │
│  — zero React, zero JSX                         │
├─────────────────────────────────────────────────┤
│  lib/utils/   lib/constants/   types/           │
│  — date helpers, formatters, enums              │
│  — shared TypeScript interfaces                 │
└─────────────────────────────────────────────────┘
```

---

## Exact Target Folder Structure

```
caterpillar-attendance/
│
├── app/                                   ← Next.js App Router
│   ├── layout.tsx                         ← Root HTML shell; loads fonts, global CSS
│   ├── page.tsx                           ← Redirect → /scanner
│   │
│   ├── (public)/
│   │   └── receipt/
│   │       └── [id]/
│   │           └── page.tsx              ← Public receipt view (no auth)
│   │
│   ├── (protected)/
│   │   ├── layout.tsx                    ← Auth guard; renders MobileShell or DesktopShell
│   │   ├── scanner/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── students/
│   │   │   └── page.tsx
│   │   ├── holidays/
│   │   │   └── page.tsx
│   │   ├── events/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── fees/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── admin/import/
│   │   │   └── page.tsx
│   │   ├── admin/manual-receipt/
│   │   │   └── page.tsx
│   │   └── admin/manage-users/
│   │       └── page.tsx
│   │
│   └── api/                              ← Next.js Route Handlers (server-only)
│       ├── telegram/
│       │   └── route.ts                  ← Telegram send-message endpoint (bot token stays here)
│       └── webhook/
│           └── telegram/
│               └── route.ts             ← Telegram incoming webhook handler
│
├── components/
│   │
│   ├── ui/                              ← Presentational primitives only
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Modal.tsx                    ← Single bottom-sheet + center-modal variant via prop
│   │   ├── Tabs.tsx
│   │   ├── Badge.tsx
│   │   ├── StatusBadge.tsx              ← Renders PRESENT/LATE/ABSENT/HOLIDAY consistently
│   │   ├── Spinner.tsx
│   │   ├── Table.tsx
│   │   ├── Avatar.tsx
│   │   ├── Toast.tsx
│   │   ├── EmptyState.tsx
│   │   └── index.ts                    ← Re-exports all ui/ components
│   │
│   ├── features/                        ← Feature modules (hooks + ui/ only)
│   │   │
│   │   ├── scanner/
│   │   │   ├── ScannerCamera.tsx        ← Camera lifecycle + QR decode; calls onScan(studentId)
│   │   │   ├── ManualAttendanceList.tsx ← Student list for manual mode
│   │   │   ├── AttendanceCounts.tsx     ← Present/late/absent/holiday summary bar
│   │   │   ├── AdminScannerControls.tsx ← "Run absent marking" + notify button (admin-only)
│   │   │   └── ScannerPage.tsx          ← Composes the above; owns mode state (camera/manual)
│   │   │
│   │   ├── dashboard/
│   │   │   ├── BranchSummaryGrid.tsx    ← Cards per branch with totals + rate
│   │   │   ├── StatusDrilldown.tsx      ← Expanded list of students per status
│   │   │   ├── StatusOverrideModal.tsx  ← Admin-only status change (admin prop gates render)
│   │   │   └── DashboardPage.tsx
│   │   │
│   │   ├── students/
│   │   │   ├── StudentList.tsx          ← Filtered, searchable list
│   │   │   ├── StudentFilters.tsx       ← Branch/age-group/telegram/attendance filter bar
│   │   │   ├── StudentForm.tsx          ← Add + edit (mode prop)
│   │   │   ├── QRCodeModal.tsx          ← Single student QR
│   │   │   ├── QRBatchPrint.tsx         ← Opens print window; pure util (no Supabase)
│   │   │   └── StudentsPage.tsx
│   │   │
│   │   ├── holidays/
│   │   │   ├── StudentLeaveList.tsx
│   │   │   ├── SchoolClosureList.tsx
│   │   │   ├── AddLeaveForm.tsx
│   │   │   ├── AddClosureForm.tsx
│   │   │   └── HolidaysPage.tsx
│   │   │
│   │   ├── events/
│   │   │   ├── EventList.tsx
│   │   │   ├── EventForm.tsx
│   │   │   └── EventsPage.tsx
│   │   │
│   │   ├── reports/
│   │   │   ├── AttendanceTable.tsx
│   │   │   ├── ReportFilters.tsx
│   │   │   ├── ExportControls.tsx       ← CSV + PDF; no Supabase; receives data as props
│   │   │   └── ReportsPage.tsx
│   │   │
│   │   ├── fees/
│   │   │   ├── FeeStatusGrid.tsx        ← Paid/unpaid summary cards
│   │   │   ├── PaymentForm.tsx          ← Single + batch record modal
│   │   │   ├── ReceiptPreview.tsx       ← Renders receipt HTML; print-ready
│   │   │   └── FeesPage.tsx
│   │   │
│   │   ├── manual-receipt/
│   │   │   ├── MonthSelector.tsx
│   │   │   ├── ManualReceiptForm.tsx
│   │   │   └── ManualReceiptPage.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ChangePasswordForm.tsx
│   │   │
│   │   ├── importer/
│   │   │   ├── CsvUploader.tsx
│   │   │   ├── ImportPreview.tsx
│   │   │   ├── ImportResults.tsx
│   │   │   └── ImporterPage.tsx
│   │   │
│   │   └── receipt/
│   │       └── PublicReceipt.tsx        ← Used by (public)/receipt/[id]/page.tsx
│   │
│   └── shells/                          ← Layout shells (responsive strategy)
│       ├── MobileShell.tsx              ← Fixed bottom nav; portrait-first layout
│       ├── DesktopShell.tsx             ← Sidebar nav; fluid layout; no bottom nav
│       ├── BottomNav.tsx                ← Mobile-only nav bar
│       ├── Sidebar.tsx                  ← Desktop-only sidebar
│       └── ShellRouter.tsx              ← Reads useViewport(); renders Mobile or Desktop shell
│
├── hooks/                               ← Shared data + state hooks
│   ├── useSession.ts                    ← Auth session from localStorage + server validation
│   ├── useViewport.ts                   ← Returns { isMobile, isDesktop }; drives ShellRouter
│   ├── useAttendance.ts                 ← Today's counts, upsert, absent-marking trigger
│   ├── useStudents.ts                   ← Student list + CRUD actions
│   ├── useBranches.ts                   ← Branch list; cached; single source
│   ├── useHolidays.ts                   ← Student leave + school closures
│   ├── useEvents.ts                     ← Events CRUD + today-event detection
│   ├── useDashboardSummary.ts           ← Daily branch summary + drill-down
│   ├── useFees.ts                       ← Payments query + record action
│   ├── useReports.ts                    ← Date-range attendance query
│   ├── useUsers.ts                      ← User list + password reset (admin/superadmin)
│   ├── useReceipt.ts                    ← Single receipt fetch (public page)
│   ├── useLanguage.ts                   ← i18n (keep existing, typed)
│   └── useToast.ts                      ← Global toast state
│
├── lib/
│   │
│   ├── services/                        ← All Supabase + external API calls
│   │   ├── attendance.service.ts        ← recordScan, upsertAttendance, runAbsentMarking, getDailySummary
│   │   ├── students.service.ts          ← getStudents, addStudent, updateStudent, deactivateStudent
│   │   ├── branches.service.ts          ← getBranches (single cached source)
│   │   ├── payments.service.ts          ← getPayments, createPayment (calls generate_receipt_no rpc)
│   │   ├── fees.service.ts              ← fee-specific filters/summaries built on payments.service
│   │   ├── holidays.service.ts          ← getHolidays, addHoliday, deleteHoliday, getClosures, addClosure, deleteOldClosures
│   │   ├── events.service.ts            ← getEvents, addEvent, deleteEvent
│   │   ├── reports.service.ts           ← getAttendanceRange (date-range query with optional branch)
│   │   ├── users.service.ts             ← getUsers, resetPassword, changePassword
│   │   ├── receipts.service.ts          ← getReceiptById (public)
│   │   ├── importer.service.ts          ← importStudentsCSV bulk insert
│   │   └── telegram.service.ts          ← sendTelegramMessage, notifyAbsentParents
│   │                                       (server-only; calls /api/telegram route handler)
│   │
│   ├── supabase/
│   │   ├── client.ts                    ← Browser Supabase client (anon key; for hooks/components)
│   │   └── server.ts                    ← Server Supabase client (service role; for Route Handlers)
│   │
│   ├── utils/
│   │   ├── date.ts                      ← getMYT(): returns today YYYY-MM-DD in UTC+8; single source
│   │   ├── receipt.ts                   ← generateReceiptHTML(payment, baseUrl): shared template
│   │   ├── csv.ts                       ← parseCsv, exportToCsv
│   │   ├── print.ts                     ← openPrintWindow(html): shared print-window utility
│   │   ├── phone.ts                     ← normalizeMalaysianPhone (moved from telegram_webhook)
│   │   └── qr.ts                        ← generateQRDataURL(studentId): wraps qrcode library
│   │
│   └── constants/
│       ├── attendance.ts                ← STATUS map (single source; colors, labels, bg)
│       ├── ageGroups.ts                 ← AGE_GROUPS array (single source; used in UI + validation)
│       ├── branches.ts                  ← BRANCH_SLUGS whitelist (used in Importer + validation)
│       └── months.ts                    ← MONTHS array + helpers
│
├── types/
│   ├── index.ts                         ← Re-exports all types
│   ├── auth.ts                          ← Session, AppUser, UserRole
│   ├── students.ts                      ← Student, Parent, Branch, AgeGroup
│   ├── attendance.ts                    ← AttendanceRecord, AttendanceStatus, DailySummary
│   ├── payments.ts                      ← Payment, PaymentMethod
│   ├── events.ts                        ← Event
│   └── holidays.ts                      ← Holiday, SchoolClosure
│
└── public/
    ├── manifest.json
    ├── logo.png
    └── guide.html
```

---

## Naming Conventions

### Files

| Type | Convention | Example |
|---|---|---|
| Next.js route files | lowercase | `app/(protected)/scanner/page.tsx` |
| UI primitives | PascalCase | `components/ui/StatusBadge.tsx` |
| Feature components | PascalCase | `components/features/scanner/ScannerCamera.tsx` |
| Hooks | camelCase, `use` prefix | `hooks/useAttendance.ts` |
| Services | camelCase, `.service.ts` suffix | `lib/services/attendance.service.ts` |
| Utils | camelCase | `lib/utils/date.ts` |
| Constants | camelCase file, UPPER_SNAKE exported values | `lib/constants/attendance.ts` → `export const STATUS = ...` |
| Types | camelCase file, PascalCase types | `types/students.ts` → `export type Student = ...` |
| Server-only files | no special convention; enforced by Next.js `server-only` package import |

### Functions & Exports

| Layer | Pattern | Example |
|---|---|---|
| Service functions | verb + noun, async | `getStudents()`, `createPayment()`, `runAbsentMarking()` |
| Hook return shape | `{ data, isLoading, error, actions }` | `const { students, isLoading, addStudent } = useStudents()` |
| UI component props | `XxxProps` interface in same file | `interface ButtonProps { ... }` |
| Feature page component | `XxxPage` | `ScannerPage`, `FeesPage` |
| Constants | UPPER_SNAKE_CASE | `STATUS`, `AGE_GROUPS`, `BRANCH_SLUGS` |

---

## Responsive Strategy (Detail)

The responsive decision is made **once**, at the layout level, and never revisited inside feature components.

```
app/(protected)/layout.tsx
  └── <ShellRouter session={session} />
        ├── useViewport() → isMobile (≤ 768px) or isDesktop
        ├── if isMobile  → <MobileShell>  <-- bottom nav, portrait layout
        └── if isDesktop → <DesktopShell> <-- sidebar, fluid layout
```

`MobileShell` and `DesktopShell` both accept `{ children, session, isAdmin }`. They wrap the same `children` (the feature pages) in different chrome. Feature components receive no viewport information — they render the same JSX in both shells.

If a feature genuinely needs different mobile vs desktop presentation (e.g. Scanner shows camera-first on mobile, list-first on desktop), that is handled by a **prop** on the feature component (`variant: 'camera' | 'list'`) passed from the shell, not by a breakpoint class inside the component.

```
MobileShell → <ScannerPage defaultMode="camera" />
DesktopShell → <ScannerPage defaultMode="manual" />
```

---

## Migration Mapping (Old → New)

| Old file | New location(s) |
|---|---|
| `src/lib/supabase.js` | `lib/supabase/client.ts` + `lib/supabase/server.ts` |
| `src/lib/auth.js` | `lib/services/users.service.ts` + `hooks/useSession.ts` |
| `src/hooks/useLanguage.js` | `hooks/useLanguage.ts` (keep, add types) |
| `src/components/Login.jsx` | `components/features/auth/LoginForm.tsx` + `hooks/useSession.ts` |
| `src/components/Scanner.jsx` | split into 4 files under `components/features/scanner/` + `lib/services/attendance.service.ts` + `hooks/useAttendance.ts` + `lib/utils/date.ts` |
| `src/components/Dashboard.jsx` | `components/features/dashboard/` (4 files) + `hooks/useDashboardSummary.ts` |
| `src/components/Students.jsx` | `components/features/students/` (5 files) + `hooks/useStudents.ts` + `lib/utils/qr.ts` + `lib/utils/print.ts` |
| `src/components/Holidays.jsx` | `components/features/holidays/` (4 files) + `hooks/useHolidays.ts` + `lib/services/holidays.service.ts` |
| `src/components/Events.jsx` | `components/features/events/` (3 files) + `hooks/useEvents.ts` |
| `src/components/Reports.jsx` | `components/features/reports/` (4 files) + `hooks/useReports.ts` + `lib/utils/csv.ts` + `lib/constants/attendance.ts` |
| `src/components/Fees.jsx` | `components/features/fees/` (4 files) + `hooks/useFees.ts` + `lib/utils/receipt.ts` (deduplicated) + `app/api/telegram/route.ts` (token moved server-side) |
| `src/components/ManualReceipt.jsx` | `components/features/manual-receipt/` (3 files) — shares `lib/utils/receipt.ts` with Fees; no duplicate template |
| `src/components/Receipt.jsx` | `components/features/receipt/PublicReceipt.tsx` + `hooks/useReceipt.ts` |
| `src/components/Importer.jsx` | `components/features/importer/` (4 files) + `lib/services/importer.service.ts` + `lib/utils/csv.ts` |
| `src/components/Admin.jsx` | `components/features/dashboard/AdminNav.tsx` or kept inline in `app/(protected)/admin/page.tsx` (it's 81 lines, mostly nav) |
| `src/components/ManageUsers.jsx` | `components/features/auth/ManageUsersPage.tsx` + `hooks/useUsers.ts` |
| `src/components/ChangePassword.jsx` | `components/features/auth/ChangePasswordForm.tsx` |
| `src/components/Navbar.jsx` | split into `components/shells/BottomNav.tsx` (mobile) + `components/shells/Sidebar.tsx` (desktop) |
| Hardcoded Telegram bot token (4 locations) | `app/api/telegram/route.ts` reads from `TELEGRAM_BOT_TOKEN` env var only |
| Hardcoded receipt domain `nimonimo.tech` (2 locations) | `NEXT_PUBLIC_BASE_URL` env var; `lib/utils/receipt.ts` reads it |
| Inline `STATUS` object (2 locations, diverging) | `lib/constants/attendance.ts` — single export, consumed by all |
| Malaysia date derivation (5 locations, inconsistent) | `lib/utils/date.ts` → `getMYT()` — single export |
| `supabase/functions/notify_absent_parents/` | `app/api/telegram/route.ts` + `lib/services/telegram.service.ts` |
| `supabase/functions/telegram_webhook/` | `app/api/webhook/telegram/route.ts` + `lib/utils/phone.ts` |

---

## Unit Test Coverage

98 tests across 10 test files (`npm test`). E2E: 1 test (`npx playwright test`).

| Service / util | Functions covered | Status |
|---|---|---|
| `attendance.service.js` | `recordScan`, `verifyStudentBranch`, `getTodayCounts`, `getStudentsForBranch`, `upsertAttendance`, `getScannerBranches` | [x] |
| `students.service.js` | `getStudents`, `getBranches`, `generateStudentNo`, `addStudent`, `addParent`, `updateStudent`, `deactivateStudent` | [x] |
| `holidays.service.js` | `getHolidays`, `getClosures`, `createHoliday`, `deleteHoliday`, `createClosure`, `deleteClosure`, `deletePastClosures` | [x] |
| `events.service.js` | `getEvents`, `createEvent`, `deleteEvent` | [x] |
| `reports.service.js` | `getAttendanceRange` | [x] |
| `receipts.service.js` | `getReceiptById` | [x] |
| `users.service.js` | `loginWithCredentials`, `getUserRole`, `adminResetPassword`, `changeOwnPassword`, `getUsers` | [x] |
| `dashboard.service.js` | `getDrilldown`, `overrideStatus`, `getTodayEvent`, `markAbsentForEvent`, `markAllAbsent` | [x] |
| `utils/date.js` | `getMYT`, `getMYTDaysAgo` | [x] |
| `utils/csv.js` | `exportToCSV` | [x] |
| `fees.service.js` | `getParentTelegramId`, `sendTelegramReceipt` | [ ] |
| `manual-receipt.service.js` | `sendTelegramMultiReceipt` | [ ] |
| `importer.service.js` | `importStudentsCSV` | [ ] |
| `utils/receipt.js` | `generateReceiptHTML` | [ ] |
| `utils/print.js` | `openPrintWindow` | [ ] |
| `utils/qr.js` | `generateQRDataURL`, `openQRBatchPrint` | [ ] |
| All hooks | — | [ ] |
| All UI components | — | [ ] |

## Known gaps

- `checkin-to-report` E2E uses fully mocked Supabase responses — does not validate real schema/RLS. Consider a smoke test against a seeded staging Supabase project before production deploy.

---

## Open Decisions (needs your input before implementation)

1. **Auth strategy.** Current app uses a custom `app_users` table with plain-text passwords. The target can either: (a) migrate to Supabase Auth (email/password with bcrypt) — more work, more secure; or (b) keep the custom table but hash passwords server-side via a Route Handler — less migration risk. Which approach?

2. **Server vs client components.** Dashboard summary and Reports data could be fetched server-side (Next.js Server Components, faster first paint). Scanner must remain a Client Component (camera, vibration APIs). Recommend: make read-heavy pages Server Components, mutation-heavy pages Client Components — but confirm this is acceptable before wiring.

3. **Supabase real-time.** Nothing currently uses `supabase.channel()`. Dashboard could benefit from live attendance updates without refresh. Out of scope for the initial refactor?

4. **Base path.** Current Vite config sets `base: '/cpcc/'`. In Next.js this becomes `basePath: '/cpcc'` in `next.config.ts`. Confirm this path is still needed (suggests reverse proxy deployment).

5. **TypeScript.** The plan assumes a full TypeScript migration (`.tsx`/`.ts` throughout). If you want to stay in JS first and add types incrementally, all the `.ts` extensions above become `.js` and interfaces become JSDoc comments.
