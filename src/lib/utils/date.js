// Malaysia is UTC+8 — always derive today's date from device local time, not UTC,
// so that e.g. 12:30 AM MYT doesn't silently resolve to the previous UTC day.
function formatLocal(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getMYT() {
  return formatLocal(new Date())
}

export function getMYTDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return formatLocal(d)
}
