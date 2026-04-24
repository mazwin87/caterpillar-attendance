const SESSION_KEY = 'caterpillar_session'

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    const today = new Date().toDateString()
    if (session.date !== today) {
      clearSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function setSession(user, teacherName = '') {
  const session = {
    ...user,
    teacherName,
    date: new Date().toDateString(),
    loginTime: new Date().toISOString(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}