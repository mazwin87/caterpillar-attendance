export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque']

export const AGE_GROUPS = [
  '3-6months', '7-12months', '1year', '2year', '3year', '4year', '5year', '6year',
]

export const AGE_GROUP_LABELS = {
  '3-6months':  '3–6 Months',
  '7-12months': '7–12 Months',
  '1year': '1 Year',
  '2year': '2 Years',
  '3year': '3 Years',
  '4year': '4 Years',
  '5year': '5 Years',
  '6year': '6 Years',
}

export const AGE_OPTIONS = AGE_GROUPS.map(value => ({ value, label: AGE_GROUP_LABELS[value] }))

// Canonical attendance-status display config — color/background/label per status.
// Single source of truth for Dashboard, Reports, Scanner, Students, Fees, Holidays.
export const STATUS = {
  PRESENT: { color: 'var(--present)', bg: 'var(--present-bg)', label: 'Present' },
  LATE:    { color: 'var(--late)',    bg: 'var(--late-bg)',    label: 'Late' },
  ABSENT:  { color: 'var(--absent)',  bg: 'var(--absent-bg)',  label: 'Absent' },
  HOLIDAY: { color: 'var(--holiday)', bg: 'var(--holiday-bg)', label: 'Holiday' },
}

// Static Tailwind class lookup per status — every value here is a complete
// literal string so Tailwind's build-time scanner can find it (it can't see
// dynamically-interpolated class names like `bg-${x}`).
export const STATUS_CLASSES = {
  PRESENT: { text: 'text-present', bg: 'bg-present-bg', border: 'border-present', dot: 'bg-present' },
  LATE:    { text: 'text-late',    bg: 'bg-late-bg',    border: 'border-late',    dot: 'bg-late' },
  ABSENT:  { text: 'text-absent',  bg: 'bg-absent-bg',  border: 'border-absent',  dot: 'bg-absent' },
  HOLIDAY: { text: 'text-holiday', bg: 'bg-holiday-bg', border: 'border-holiday', dot: 'bg-holiday' },
}
