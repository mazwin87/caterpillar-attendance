# Desktop UI Plan

Produced 2026-08-10. Approved 2026-08-11 with three adjustments (see below).

---

## Approved Adjustments (2026-08-11)

**A1 — MobileView extraction is a pure move.**
Cut existing JSX, paste into `*MobileView`, zero logic changes, no cleanup while moving.
After each extraction, test that the mobile page still works before touching the desktop view.
Mobile staying intact is the priority.

**A2 — No hydration mismatch, no flash.**
This is a plain Vite SPA — no SSR, no Next.js. `window.matchMedia` is always available on first render.
`useMediaQuery` uses a lazy `useState` initializer so the correct value is read synchronously:
```
useState(() => window.matchMedia(query).matches)
```
No flash. Resizing across 1024px mid-session will remount the shell and reset page-level state
(hook re-runs, data refetches). Acceptable — this app is single-device per user. Noted, not fixed.

**A3 — Revised build order.**
Start with Manage Users (simplest table), not Dashboard. Prove the shell on easy ground first.

---

## 1. Layout Strategy

### Shell switching

`App.jsx` adds a single `useMediaQuery` call at the top level:

```
const isDesktop = useMediaQuery('(min-width: 1024px)')
```

- `true`  → wrap all routes in `<DesktopShell>`
- `false` → wrap all routes in `<MobileShell>` (existing Navbar, unchanged)

The switch is at the shell level only. Pages never check the breakpoint themselves.

### DesktopShell structure

```
┌──────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────────────────────────┐  │
│  │          │  │                              │  │
│  │ Sidebar  │  │      <Outlet />              │  │
│  │  (fixed) │  │   (page content area)        │  │
│  │          │  │                              │  │
│  └──────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

- Sidebar: fixed left, 220px wide, contains nav links + user info + logout
- Content area: `margin-left: 220px`, scrollable, full height
- No bottom navbar on desktop

### MobileShell (unchanged)

Existing `Navbar.jsx` — fixed bottom bar, icon + label, `--navbar-height` CSS var. Zero changes.

### Zero logic duplication

Every page component calls its hook once:

```
function FeesPage({ session }) {
  const hook = useFees(session)          // ← one hook, one call
  return isDesktop
    ? <FeesDesktopView {...hook} />
    : <FeesMobileView {...hook} />
}
```

Hooks live in `/src/hooks/` — untouched. Services live in `/src/lib/services/` — untouched. Desktop views are new files that receive hook output as props. Mobile views are the existing page JSX, extracted into `*MobileView` components.

### File layout (target)

```
src/
  components/
    layout/
      DesktopShell.jsx        ← new
      MobileShell.jsx         ← wraps existing Navbar
      Sidebar.jsx             ← new
    features/
      fees/
        FeesMobileView.jsx    ← existing Fees.jsx content moved here
        FeesDesktopView.jsx   ← new
        FeesPage.jsx          ← new thin wrapper, calls useFees, picks view
      students/
        StudentsMobileView.jsx
        StudentsDesktopView.jsx
        StudentsPage.jsx
      ... (same pattern for each feature)
    ui/
      Table.jsx               ← new primitive
      DataFilter.jsx          ← new primitive
      PageHeader.jsx          ← new primitive
```

---

## 2. Per-Page Desktop Treatment

### Dashboard (`/dashboard`)
**Mobile (current):** summary cards (present / absent / late / holiday), tap card → drilldown modal.

**Desktop:**
- Top row: same 4 summary cards, wider, with percentage trend if available
- Below: attendance table for today — student name, branch, status, time scanned. Sortable, filterable by branch/status.
- Right column (reserved): chart area placeholder — this is where the future Reports dashboard will extend. Keep the grid slot empty for now, label it "Analytics (coming soon)" or just leave blank space. Do not fill it with content that will need to be removed later.
- No drilldown modal — clicking a row expands inline or navigates to student detail.

### Students (`/students`)
**Mobile (current):** card list with search, add student modal, edit/deactivate actions.

**Desktop:**
- Full data table: columns → Name, Student No, Branch, Age Group, Monthly Fee, Status (active/inactive)
- Sortable by name, branch, age group
- Inline row actions: Edit, Deactivate (no separate modal needed for simple actions)
- Add student: slide-in panel from right (not modal) — keeps table visible
- Filter bar above table: branch, age group, status dropdowns

### Fees / Payments (`/fees`)
**Mobile (current):** student cards with paid/unpaid badge, select for batch, single payment modal.

**Desktop:**
- Split: left filter panel (branch, month, year, status) — always visible, not a dropdown
- Main: data table → Student, Branch, Month, Status (Paid/Unpaid), Amount, Receipt No, Actions
- Batch select via checkboxes in table rows
- Record payment: modal (same as mobile, already clean)
- This is the richest table in the app — establish the Table + DataFilter pattern here

### Reports (`/reports`)
**Mobile (current):** filter form + view/download report.

**Desktop — design this for the future dashboard, not just today's view:**
- Left panel: filter controls (branch, date range, report type) — persistent sidebar panel, not a dropdown
- Main area top: summary metric cards (total present, avg attendance rate, etc.)
- Main area middle: data table (date × branch attendance, or per-student breakdown depending on report type)
- Main area bottom: chart area — placeholder grid slot for future chart components (bar chart, line chart). Reserve the space structurally; wire up a "Charts coming soon" placeholder.
- Export button always visible top-right
- This page sets the pattern for what the future analytics dashboard becomes. Every structural decision here should assume charts and multiple data views will be added without rework.

### Scanner (`/scanner`)
**Mobile (current):** live QR camera, scan result card, admin controls (Run Now).

**Desktop:** Camera QR scanning is a mobile activity — teachers scan on phones. Desktop scanner is a different tool:
- Left: searchable student list — type name or student_no, click to mark present/late
- Right: today's attendance log — live list of who has been marked and at what time
- Admin controls (Run Now / mark absent) visible in a panel if role is admin/superadmin
- No camera component on desktop

### Holidays (`/holidays`)
**Mobile (current):** list of holidays with add form.

**Desktop:**
- Table: Student, Branch, Start Date, End Date, Reason, Actions
- Add holiday: inline form above table or panel — not a card
- Filter by branch, date range

### Events (`/events`)
**Mobile (current):** event cards with age group badges, add event modal.

**Desktop:**
- Table: Event Name, Date, Branches, Age Groups, Actions
- Add/edit: modal (same as mobile — events are simple enough)

### Manual Receipt (`/manual-receipt`)
**Mobile (current):** form → generate → print.

**Desktop:**
- Side-by-side: form on left, receipt preview on right (live preview as fields are filled)
- Print button stays top-right
- Removes the need to generate then scroll to see — both visible at once

### Importer (`/import`)
**Mobile (current):** download template, upload CSV, validation errors, import button.

**Desktop:** largely the same flow. Widen the error list and preview table — that's it. No structural change needed; the current layout scales acceptably.

### Manage Users (`/manage-users`)
**Mobile (current):** user cards with Reset Password button.

**Desktop:**
- Table: Username, Role, Branch, Actions (Reset Password)
- Role/branch shown as badges in columns, not buried in card subtitle
- When `set_user_role` RPC is built: Edit Role action column added here

### Admin Panel (`/admin`)
**Mobile (current):** grid of action cards linking to sub-pages.

**Desktop:** keep as a grid — it's a landing page. Widen cards, show descriptions. No structural change; it's not a data view.

### Receipt (`/receipt/:id`) — public
**Mobile + Desktop:** same component. Receipt is a print-optimised card. Center it on desktop with a max-width. No layout shell — public route, no sidebar/navbar.

### Login / ChangePassword
**Mobile + Desktop:** same components, centered card. No shell.

---

## 3. New UI Primitives Needed

These do not exist yet. Build them in `/src/components/ui/` as the desktop pages are built — add each primitive when the first page that needs it is built.

| Primitive | Purpose | First used by |
|---|---|---|
| `Table` | Sortable data table. Props: `columns` (key, label, sortable, render), `rows`, `onSort`, `selectedRows`, `onSelect`. No opinion on data — purely presentational. | Students |
| `DataFilter` | Horizontal or vertical filter bar. Wraps Select/Input into a labelled group. Props: `filters` (array of filter configs), `values`, `onChange`. | Fees |
| `PageHeader` | Desktop page title area. Props: `title`, `subtitle`, `actions` (slot for buttons). Sits above the page content, below is the main area. | Dashboard |
| `SidebarNav` | Left nav component used inside DesktopShell. Renders nav links with icons and active state. Separate from shell so it can be tested in isolation. | DesktopShell |
| `SplitPane` | Two-column layout helper. Props: `left`, `right`, `leftWidth` (default 360px). Used for Manual Receipt and Reports. | ManualReceipt |

Primitives NOT needed yet (hypothetical):
- Chart components — reserve space in Reports layout, do not build yet
- Pagination — all current datasets are small; add when data grows

---

## 4. Mobile-only / Desktop-only / Shared

| What | Mobile | Desktop |
|---|---|---|
| Bottom Navbar | ✅ | ✗ |
| Sidebar | ✗ | ✅ |
| QR camera scanner | ✅ | ✗ |
| Manual attendance entry | ✗ | ✅ |
| Card-based lists | ✅ | ✗ |
| Data tables | ✗ | ✅ |
| Bottom-slide modals | ✅ | ✗ (use center modal or panel) |
| All hooks / services | ✅ | ✅ (identical) |
| Auth flow (login, change password) | ✅ | ✅ (same component, centered) |
| Public receipt | ✅ | ✅ (same component, max-width centered) |
| Add/edit modals (center variant) | ✅ | ✅ |
| CSS design tokens (--present, --text, etc.) | ✅ | ✅ |

---

## 5. Build Order

Start with one page end-to-end to establish the full pattern, then repeat.
Each phase: branch → build → test mobile unchanged → show for review → merge → deploy.

**Phase 1 — Shell + Manage Users (simplest table, proves the pattern)**
1. `useMediaQuery` hook
2. `MobileShell.jsx` (thin wrapper around existing Navbar)
3. `DesktopShell.jsx` + `SidebarNav.jsx`
4. `PageHeader` primitive
5. `Table` primitive
6. Extract `ManageUsersMobileView` (pure move from existing ManageUsersPage)
7. `ManageUsersDesktopView` — table: Username, Role, Branch, Reset Password action
8. Confirm: mobile unchanged, desktop shell works, Table primitive proven

**Phase 2 — Dashboard**
1. Dashboard desktop view — summary cards + attendance table + reserved chart slot
2. Extract `DashboardMobileView`

**Phase 3 — Students**
1. Students desktop view — data table, add panel, branch/age-group filters
2. Extract `StudentsMobileView`

**Phase 4 — Fees (establishes DataFilter primitive)**
1. `DataFilter` primitive
2. Fees desktop view — filter panel + payment table + batch select
3. Extract `FeesMobileView`

**Phase 5 — Reports (future dashboard home)**
1. Reports desktop view — filter panel + metric cards + data table + chart placeholder grid
2. `SplitPane` primitive

**Phase 6 — Remaining pages**
- Scanner desktop (manual attendance entry)
- Manual Receipt (SplitPane, live preview)
- Holidays, Events (table views, lighter work)
- Importer, Admin Panel (minimal changes)

Each phase: branch → build → test mobile unchanged → merge → deploy.
