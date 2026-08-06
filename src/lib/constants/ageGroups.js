export const AGE_GROUPS = [
  '3-6months', '7-12months', '1year', '2year', '3year', '4year', '5year', '6year',
]

export const AGE_GROUP_LABELS = {
  '3-6months':  '3–6 Months',
  '7-12months': '7–12 Months',
  '1year':  '1 Year',
  '2year':  '2 Years',
  '3year':  '3 Years',
  '4year':  '4 Years',
  '5year':  '5 Years',
  '6year':  '6 Years',
}

export const AGE_OPTIONS = AGE_GROUPS.map(v => ({ value: v, label: AGE_GROUP_LABELS[v] }))

// Returns the age-group key for a given date-of-birth string, or null if out of range.
export function getAgeGroup(dateOfBirth) {
  if (!dateOfBirth) return null
  const months = (Date.now() - new Date(dateOfBirth)) / (1000 * 60 * 60 * 24 * 30.44)
  if (months <  3) return null
  if (months <  7) return { label: '3-6months' }
  if (months < 13) return { label: '7-12months' }
  if (months < 24) return { label: '1year' }
  if (months < 36) return { label: '2year' }
  if (months < 48) return { label: '3year' }
  if (months < 60) return { label: '4year' }
  if (months < 72) return { label: '5year' }
  return { label: '6year' }
}
