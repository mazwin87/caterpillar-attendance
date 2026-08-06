# Students — Test Cases

**Module:** `students`  
**Route:** `/students`  
**Last verified:** 2026-08-06

---

## Preconditions

- At least two branches exist
- At least one student per branch
- At least one student with a parent Telegram ID linked, at least one without
- At least one student with attendance today for attendance filter tests

---

## TC-ST-01 — Page loads with student list and header counts

**Steps:**
1. Navigate to Students page

**Expected:**
- "Students" heading visible
- Subtitle shows "X of Y students" (filtered count / total count)
- Student cards rendered in a list
- Search bar visible
- Branch filter dropdown shows "All branches"
- Filter row visible below search

---

## TC-ST-02 — Search by student name

**Steps:**
1. Type part of a student's name in the search box

**Expected:**
- List filters in real time to only students whose name contains the typed text (case-insensitive)
- Count subtitle updates (e.g. "2 of 34 students")
- Clearing the search restores the full list

---

## TC-ST-03 — Search by student number

**Steps:**
1. Type a student number (or partial number) in the search box

**Expected:**
- List filters to students whose `student_no` contains the typed text
- Works independently of name search (both matched simultaneously)

---

## TC-ST-04 — Filter by branch dropdown

**Steps:**
1. Select a specific branch from the branch dropdown in the search row

**Expected:**
- List shows only students belonging to that branch
- Count subtitle updates
- "All branches" restores full list

---

## TC-ST-05 — Filter by age group (single selection)

**Steps:**
1. Tap an age group toggle button (e.g. "1 Year")

**Expected:**
- "1 Year" button turns active (colored)
- List filters to students in that age group
- Count updates

---

## TC-ST-06 — Filter by age group (multi-selection)

**Steps:**
1. Tap "1 Year", then tap "2 Years"

**Expected:**
- Both buttons are active
- List shows students in either age group
- Count reflects combined results

---

## TC-ST-07 — Deselect age group filter

**Steps:**
1. With "1 Year" active, tap "1 Year" again

**Expected:**
- Button returns to inactive state
- Filter removed; list expands accordingly

---

## TC-ST-08 — Filter by Telegram link status

**Steps:**
1. Select "Linked" from the Telegram filter

**Expected:**
- List shows only students whose parent has a Telegram ID set
- Each card shows green "● Linked" badge

2. Select "Not linked"

**Expected:**
- List shows only students with no parent Telegram ID
- Each card shows red "○ Unlinked" badge

---

## TC-ST-09 — Filter by attendance status

**Steps:**
1. Select "Present" from the attendance filter

**Expected:**
- List shows only students with PRESENT attendance today
- Students with no attendance row are excluded

2. Select "Absent"

**Expected:**
- List shows students with ABSENT attendance today PLUS students with no attendance row (treated as absent)

---

## TC-ST-10 — Clear all filters resets to full list

**Steps:**
1. Apply branch, age group, and Telegram filters simultaneously
2. Tap "Clear all" chip (or clear button)

**Expected:**
- All filters reset
- List shows all students
- Count shows full total

---

## TC-ST-11 — Student card shows correct info

**Steps:**
1. Observe a student card in the list

**Expected:**
- Initial avatar circle with first letter of name
- Student name (truncated with ellipsis if too long)
- Green "● Linked" or red "○ Unlinked" Telegram badge
- Student number · Branch short-name (without "Caterpillar Playtime " prefix)
- Age group pill (yellow) if age group is set

---

## TC-ST-12 — Actions menu opens and closes

**Steps:**
1. Tap "Actions" button on a student card
2. Tap anywhere outside the card

**Expected:**
- Actions menu expands inline below the student info row
- Four buttons: 📱 Telegram, 🔲 View QR, ✏️ Edit, 🗑️ Delete
- Tapping outside closes the menu (root div click handler)

---

## TC-ST-13 — Copy Telegram link

**Steps:**
1. Open Actions menu for a student
2. Tap "📱 Telegram"

**Expected:**
- Clipboard receives `https://t.me/caterpillarAttendanceBot?start=<student-uuid>`
- Alert: "Telegram link copied!"
- Actions menu closes

---

## TC-ST-14 — View QR code modal

**Steps:**
1. Open Actions menu, tap "🔲 View QR"

**Expected:**
- Modal appears centered on screen
- QR code image rendered (may take a moment to generate)
- Student name and student number shown below QR
- Download link visible
- Tapping outside modal (or close button) closes it

---

## TC-ST-15 — Download QR code

**Steps:**
1. Open QR modal for a student
2. Tap the download link

**Expected:**
- Image file downloaded (PNG) named after the student

---

## TC-ST-16 — Add student form — opens and closes

**Steps:**
1. Tap "+ Add" button in header
2. Tap close (×) or cancel

**Expected:**
- Bottom sheet slides up with the Add Student form
- Closing slides it back down without saving
- Student list unchanged

---

## TC-ST-17 — Add student — auto-generates student number on branch select

**Steps:**
1. Open Add Student form
2. Select a branch

**Expected:**
- Student number field auto-populates with the next sequential number for that branch (e.g. KL-042)
- Field is editable if needed

---

## TC-ST-18 — Add student — validation prevents save with missing required fields

**Steps:**
1. Open Add Student form
2. Leave name empty, select branch, fill other fields
3. Tap Save

**Expected:**
- Save is blocked (button disabled or validation alert)
- No DB record created

---

## TC-ST-19 — Add student — successful submission

**Steps:**
1. Fill all required fields: name, branch, age group, parent name, parent phone
2. Tap Save

**Expected:**
- Form closes
- New student appears in the list immediately
- Student's card shows correct name, branch, age group pill

---

## TC-ST-20 — Edit student form — pre-fills existing data

**Steps:**
1. Open Actions menu for a student, tap ✏️ Edit

**Expected:**
- Edit form slides up pre-filled with the student's name, age group, date of birth, monthly fee
- Notice shown: branch and student number cannot be changed in edit mode
- Branch and student number fields are read-only or hidden

---

## TC-ST-21 — Edit student — saves changes

**Steps:**
1. Open edit form for a student
2. Change the name
3. Tap Save

**Expected:**
- Form closes
- Student card in the list shows the updated name immediately

---

## TC-ST-22 — Edit different students consecutively

**Steps:**
1. Edit student A, cancel
2. Open edit for student B

**Expected:**
- Edit form shows student B's data, not student A's
- No stale state from previous edit (form remounts with `key={student.id}`)

---

## TC-ST-23 — Delete student — confirmation required

**Steps:**
1. Open Actions menu, tap 🗑️ Delete

**Expected:**
- Browser confirm dialog: "Delete this student?"
- Cancelling leaves the student in the list unchanged

---

## TC-ST-24 — Delete student — removes from list

**Steps:**
1. Confirm deletion

**Expected:**
- Student disappears from the list immediately
- Count subtitle decrements

---

## TC-ST-25 — Print QR modal — branch required before printing

**Steps:**
1. Tap 🖨️ Print QR in the header
2. Click Print without selecting a branch

**Expected:**
- Alert: "Please select a branch"
- No print window opens

---

## TC-ST-26 — Batch print QR codes

**Steps:**
1. Tap 🖨️ Print QR
2. Select a branch
3. Tap 🖨️ Print

**Expected:**
- Button shows "Generating..." while processing
- Print window opens with A4 layout: 3×3 QR grid (9 per page)
- Each QR labeled with student name and number
- Multiple pages if more than 9 students in the branch
- Print modal closes after window opens

---

## TC-ST-27 — Combined filters (branch + age group + search)

**Steps:**
1. Select branch "Sentul"
2. Select age group "2 Years"
3. Type "Ali" in search

**Expected:**
- List shows only students that match ALL three conditions simultaneously
- Count reflects combined result

---

## Regression Notes

- **openMenu state owned by StudentsPage** — the root div's `onClick={() => setOpenMenu(null)}` closes any open action menu when tapping outside. If a new component is added between the root div and the student card, ensure `e.stopPropagation()` is called on the card's onClick.
- **Edit form uses key prop** — `<StudentForm key={editStudent.id}>` ensures a full remount when switching between students. Do not remove this key or stale form state will bleed between edits.
- **attendanceMap derived at page load** — the attendance filter reflects today's state at the time the page loaded. If attendance changes elsewhere (e.g. via scanner), pull-to-refresh or page reload is needed to see the updated filter results.
- **Auto student number is async** — the student number field populates after an async DB call on branch select. On slow connections there may be a brief empty state before the number appears.
