# E2E Testing

## Setup

- Framework: Playwright (`@playwright/test`)
- Browser: Chromium (headless)
- Config: `playwright.config.js` — targets `http://localhost:3000`, auto-starts `npm run dev`

## Running

```bash
npx playwright test              # all e2e
npx playwright test --headed     # with visible browser
npx playwright test --reporter=line  # compact output
```

## Test files

### `e2e/checkin-to-report.spec.js`

**Critical path:** manual check-in → attendance record created → visible in report

Steps tested:
1. Session injected via `addInitScript` (admin role, branch-1)
2. All Supabase REST calls intercepted via `page.route`
3. Camera unavailable in headless → error overlay appears → "Switch to Manual" clicked
4. Student "Ali bin Abu" appears in manual list
5. Click "In" → button changes to "✓ Present"
6. Present counter increments to 1
7. Navigate to `/cpcc/reports` → click Search
8. Student name and ID visible in attendance table

## Mocking strategy

- `page.addInitScript` injects `caterpillar_session` into `localStorage` before React loads
- `page.route('**/rykxrnhwvvlwlxdzjyub.supabase.co/**', handler)` intercepts all Supabase REST calls
- Handler dispatches on URL path + HTTP method
- Module-level `attendanceInserted` flag makes GET /attendance return the record only after POST succeeds — simulating stateful backend

## Known quirks

- **Camera in headless:** `navigator.mediaDevices` is unavailable → `ScannerCamera` shows an error overlay (zIndex 25) that covers the header toggle (zIndex 20). The "Switch to Manual" button in the overlay is the entry point in tests.
- **Reports are admin-only:** `/cpcc/reports` route only renders for `role: admin|superadmin`. Session must be admin even though the scanner flow is teacher-side.
- **maybeSingle response:** Supabase `.maybeSingle()` expects `Content-Type: application/vnd.pgrst.object+json` and body `'null'` for no-record responses.
