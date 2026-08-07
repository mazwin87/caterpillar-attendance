# Check-In (Scanner) — Test Cases

**Module:** `check-in`  
**Route:** `/scan` (or camera tab)  
**Last verified:** 2026-08-06

---

## Preconditions

- At least one student with a printed or on-screen QR code
- Device has a camera (for camera mode tests)
- Logged in as admin for branch filter and Notify Absent tests
- Logged in as teacher for teacher-scoped tests

---

## Camera Mode

### TC-CI-01 — Page loads in camera mode by default

**Steps:**
1. Navigate to the scanner page

**Expected:**
- Dark camera viewfinder fills the screen
- Green QR bracket overlay centered in the frame
- "Align QR code within the frame" hint text below bracket
- Attendance counts visible at the top: Present, Late, Absent (with counts)
- "Switch to Manual" button visible at bottom

---

### TC-CI-02 — Scan a valid student QR — first scan today

**Steps:**
1. Hold a student's QR code in front of the camera

**Expected:**
- Result card slides up from the bottom showing:
  - Student name (large, bold)
  - "PRESENT" or "LATE" badge (depending on time vs. late threshold)
  - Scanned-at time
- Present or Late counter increments by 1
- Card auto-dismisses after ~2.5 seconds
- Device vibrates (on real mobile device, after first user interaction)

---

### TC-CI-03 — Scan the same QR twice — duplicate blocked

**Steps:**
1. Scan a QR that was already scanned today

**Expected:**
- Result card shows student name with "already recorded" or current status
- No duplicate attendance row created
- Counter does not double-increment

---

### TC-CI-04 — Scan an unknown QR — error shown

**Steps:**
1. Scan a QR code that is not a valid student UUID (e.g. a URL QR code)

**Expected:**
- Result card shows "No student found" or similar error
- Counts unchanged

---

### TC-CI-05 — Result card auto-dismisses after 2.5 seconds

**Steps:**
1. Successfully scan a student
2. Wait without tapping

**Expected:**
- Card slides up, shows result, then slides back down automatically after ~2.5 seconds
- Camera resumes scanning immediately after dismiss

---

### TC-CI-06 — Camera error shows fallback overlay

**Steps:**
1. Deny camera permission in browser when prompted, or test in an environment with no camera

**Expected:**
- Camera viewfinder replaced with an error overlay message
- "Switch to Manual" button still accessible

---

### TC-CI-07 — Hard refresh clears scan session

**Steps:**
1. Scan a student
2. Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R)
3. Scan the same student again

**Expected:**
- Page reloads cleanly with correct counts from database
- Scanning the same student shows "already recorded" (not a fresh PRESENT)

---

## Manual Mode

### TC-CI-08 — Switch to manual mode

**Steps:**
1. Tap "Switch to Manual" button

**Expected:**
- Camera viewfinder hides
- Light-themed manual attendance list appears
- Student list shows all students for the selected branch
- Attendance counts displayed in light theme at the top
- Search bar visible

---

### TC-CI-09 — Manual mode search filters students

**Steps:**
1. In manual mode, type part of a student's name in the search box

**Expected:**
- List filters in real time to only matching students
- Clearing the search restores the full list

---

### TC-CI-10 — Mark present in manual mode

**Steps:**
1. In manual mode, tap "Present" on a student with no attendance today

**Expected:**
- Row updates immediately to show PRESENT badge
- Present counter increments

---

### TC-CI-11 — Mark late in manual mode

**Steps:**
1. Tap "Late" on a student with no attendance today

**Expected:**
- Row shows LATE badge
- Late counter increments

---

### TC-CI-12 — Mark absent in manual mode

**Steps:**
1. Tap "Absent" on a student with no attendance today

**Expected:**
- Row shows ABSENT badge
- Absent counter increments (or absent count shown decreases from total unscanned)

---

### TC-CI-13 — Already-marked student shows current status in manual mode

**Steps:**
1. Switch to manual mode
2. Observe students already marked present via QR scan

**Expected:**
- Those students show their current status badge (PRESENT / LATE / ABSENT)
- Action buttons may still allow override (tap to re-mark)

---

### TC-CI-14 — Switch back to camera mode

**Steps:**
1. While in manual mode, tap "Switch to Camera"

**Expected:**
- Manual list hides
- Camera viewfinder reopens and begins scanning
- Counts reflect any marks made in manual mode

---

## Admin Controls

### TC-CI-15 — Admin sees branch filter dropdown

**Steps:**
1. Log in as admin, navigate to scanner

**Expected:**
- Branch dropdown visible above the manual student list (or in the admin controls area)
- Selecting a branch filters the student list to that branch only
- Counts update to reflect selected branch

---

### TC-CI-16 — Teacher does not see branch filter

**Steps:**
1. Log in as teacher

**Expected:**
- Branch dropdown not rendered
- Student list scoped to teacher's branch automatically

---

### TC-CI-17 — Notify Absent button (normal mode — no event today)

**Steps:**
1. Log in as admin
2. Ensure no event exists for today in the events table
3. Tap 🔔 Notify Absent (or "Mark & Notify")

**Expected:**
- Confirm dialog: "Mark all unscanned students as absent and send notifications?"
- On confirm: RPC runs, absent rows inserted for all unscanned students
- Success indicator shown
- Present/Late/Absent counts refresh

---

### TC-CI-18 — Notify Absent button (event mode — event exists today)

**Steps:**
1. Create an event in the events table for today with specific branches + age groups
2. Tap 🔔 Notify Absent

**Expected:**
- First confirm: "Mark all unscanned students as absent..."
- Second confirm: "Event detected: <event name>. Only students from selected branches and age groups..."
- On both confirms: only eligible students (matching branch + age group) marked absent
- Ineligible students not touched

---

### TC-CI-19 — Notify Absent — cancel on first confirm

**Steps:**
1. Tap Notify Absent
2. Cancel the first confirm dialog

**Expected:**
- Nothing happens; no absent rows inserted

---

### TC-CI-20 — Notify Absent — cancel on event second confirm

**Steps:**
1. With an event today, tap Notify Absent
2. Accept the first confirm
3. Cancel the second (event) confirm

**Expected:**
- Nothing happens; no absent rows inserted

---

## Regression Notes

- **HMR corrupts camera session** — editing any hook file while the scanner page is open in the browser causes the camera to stop scanning. Always hard refresh after any code change before testing scan behavior.
- **vibrate blocked on first load** — Chrome blocks `navigator.vibrate()` until the user has interacted with the page. On real mobile devices, vibration works normally after the first tap. The 4 "Intervention" console warnings during testing are expected and not bugs.
- **processingRef blocks concurrent scans** — if two QR codes are scanned in rapid succession, the second is silently dropped while the first is processing. This is intentional to prevent double-inserts.
- **QR codes encode raw student UUID** — not a URL. Scanning a student QR in a generic QR reader app shows a UUID string, which is expected.

---

## Known Limitations

- Only one test account may be available; testing TC-CI-02 (first scan) requires a student with no attendance row for today. Reset by deleting today's attendance row in Supabase directly.
- Late threshold time is configured in the scanner service. Verify the threshold matches the actual class start time before testing TC-CI-02 expected status (PRESENT vs LATE).
