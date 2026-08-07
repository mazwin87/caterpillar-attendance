import { test, expect } from '@playwright/test'

const SUPABASE_PATTERN = '**/rykxrnhwvvlwlxdzjyub.supabase.co/**'

// Admin session — needed because /reports is admin-only; admins can also use manual scanner
const SESSION = {
  id: 'user-admin-1',
  username: 'admin1',
  role: 'admin',
  branch_id: 'branch-1',
  teacherName: 'Puan Azizah',
  date: new Date().toDateString(),
  loginTime: new Date().toISOString(),
  mustChangePassword: false,
}

const STUDENT = {
  id: 'student-1',
  name: 'Ali bin Abu',
  student_no: 'KLTS-001',
  branch_id: 'branch-1',
  is_active: true,
  branches: { name: 'Caterpillar Playtime KL Traders' },
}

const BRANCH = { id: 'branch-1', name: 'Caterpillar Playtime KL Traders', slug: 'KLTS' }

// Injected once attendance is "created" via the In button
let attendanceInserted = false

function mockSupabase(route) {
  const url  = route.request().url()
  const method = route.request().method()

  // Branches list (getBranches in useReports)
  if (url.includes('/rest/v1/branches')) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([BRANCH]),
    })
  }

  // School calendar / holidays (useHolidays may fire)
  if (url.includes('/rest/v1/school_calendar') || url.includes('/rest/v1/holidays')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  }

  // Students list for manual attendance
  if (url.includes('/rest/v1/students')) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([STUDENT]),
    })
  }

  // RPC calls (record_scan, run_daily_absent_marking, etc.) — not used in manual flow
  if (url.includes('/rest/v1/rpc/')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
  }

  // Attendance — POST (upsertAttendance insert)
  if (url.includes('/rest/v1/attendance') && method === 'POST') {
    attendanceInserted = true
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'att-1', student_id: STUDENT.id, status: 'PRESENT', date: new Date().toISOString().split('T')[0] }]),
    })
  }

  // Attendance — PATCH (upsertAttendance update) — shouldn't fire on first mark but handle anyway
  if (url.includes('/rest/v1/attendance') && method === 'PATCH') {
    attendanceInserted = true
    return route.fulfill({ status: 204, contentType: 'application/json', body: '[]' })
  }

  // Attendance — GET
  if (url.includes('/rest/v1/attendance')) {
    // maybeSingle lookup for upsert — returns null (no existing record)
    if (url.includes('select=id') && url.includes('student_id=eq.')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/vnd.pgrst.object+json',
        body: 'null',
      })
    }
    // getAttendanceRange (reports) or getTodayCounts
    const records = attendanceInserted
      ? [{
          id: 'att-1',
          date: new Date().toISOString().split('T')[0],
          status: 'PRESENT',
          absence_reason: null,
          student_id: STUDENT.id,
          branch_id: BRANCH.id,
          students: {
            name: STUDENT.name,
            student_no: STUDENT.student_no,
            branches: { name: BRANCH.name },
            classes: null,
          },
        }]
      : []

    // getTodayCounts also selects students!inner so we return compatible shape
    const body = url.includes('students%21inner') || url.includes('students!inner')
      ? (attendanceInserted
          ? [{ status: 'PRESENT', student_id: STUDENT.id, students: { branch_id: BRANCH.id } }]
          : [])
      : records

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  }

  // Fallback — return empty
  return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
}

test.describe('Check-in → attendance record created → visible in report', () => {
  test.beforeEach(async ({ page }) => {
    attendanceInserted = false

    await page.addInitScript((session) => {
      localStorage.setItem('caterpillar_session', JSON.stringify(session))
    }, SESSION)

    await page.route(SUPABASE_PATTERN, mockSupabase)
  })

  test('manual check-in increments present count and appears in reports', async ({ page }) => {
    // ── STEP 1: Open scanner in manual mode ──────────────────────────────────
    await page.goto('/cpcc/scanner')

    // In headless Playwright, the camera is unavailable, so ScannerCamera renders
    // an error overlay (zIndex 25) that covers the header toggle. Click the overlay's
    // "Switch to Manual" button to enter manual mode.
    await page.getByRole('button', { name: 'Switch to Manual' }).click()

    // Wait for student list to load
    await expect(page.getByText('Ali bin Abu')).toBeVisible({ timeout: 10000 })

    // ── STEP 2: Click "In" to mark present ───────────────────────────────────
    const inButton = page.locator('button', { hasText: 'In' }).first()
    await inButton.click()

    // Wait for the button state to change (student is now marked present)
    await expect(page.locator('button', { hasText: '✓ Present' })).toBeVisible({ timeout: 5000 })

    // ── STEP 3: Verify present count incremented ─────────────────────────────
    // AttendanceCounts renders each stat as a `.text-center` div with a label below the number
    const presentCounter = page.locator('.text-center').filter({ hasText: 'Present' }).locator('.text-2xl')
    await expect(presentCounter).toHaveText('1')

    // ── STEP 4: Navigate to Reports ──────────────────────────────────────────
    await page.goto('/cpcc/reports')
    await expect(page).toHaveURL(/\/cpcc\/reports/)

    // ── STEP 5: Click Search ─────────────────────────────────────────────────
    await page.getByRole('button', { name: /search/i }).click()

    // ── STEP 6: Student appears in the attendance table ───────────────────────
    await expect(page.getByText('Ali bin Abu')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('KLTS-001')).toBeVisible()
  })
})
