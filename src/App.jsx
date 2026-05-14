import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Scanner from './components/Scanner'
import Dashboard from './components/Dashboard'
import Students from './components/Students'
import Holidays from './components/Holidays'
import { useLanguage } from './hooks/useLanguage'
import Reports from './components/Reports'
import Admin from './components/Admin'
import Fees from './components/Fees'
import Events from './components/Events'
import Login from './components/Login'
import Receipt from './components/Receipt'
import Importer from './components/Importer'
import { getSession, clearSession } from './lib/auth'
import ManualReceipt from './components/ManualReceipt'

export default function App() {
  const { lang, setLang, t } = useLanguage()
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const s = getSession()
    setSession(s)
    setChecking(false)

    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = midnight - now
    const timer = setTimeout(() => {
      clearSession()
      setSession(null)
    }, msUntilMidnight)

    return () => clearTimeout(timer)
  }, [])

  function handleLogin(user, teacherName) {
    setSession({ ...user, teacherName })
  }

  function handleLogout() {
    clearSession()
    setSession(null)
  }

  if (checking) return <div style={{ color: 'white' }}>Loading...</div>

  const isAdmin = session?.role === 'admin'

  return (
    <BrowserRouter basename="/cpcc">
      <Routes>
        {/* Public route — no auth needed */}
        <Route path="/receipt/:id" element={<Receipt />} />

        {/* All protected routes */}
        <Route path="*" element={
          !session
            ? <Login onLogin={handleLogin} />
            : (
              <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <Routes>
                  <Route path="/" element={<Navigate to="/scanner" replace />} />
                  <Route path="/scanner"   element={<Scanner lang={lang} setLang={setLang} t={t} session={session} />} />
                  <Route path="/dashboard" element={<Dashboard t={t} session={session} isAdmin={isAdmin} onLogout={handleLogout} />} />
                  <Route path="/students"  element={<Students t={t} session={session} />} />
                  <Route path="/holidays"  element={<Holidays t={t} isAdmin={isAdmin} />} />
                  <Route path="/events"    element={<Events t={t} />} />
                  {isAdmin && <Route path="/admin"   element={<Admin session={session} />} />}
                  {isAdmin && <Route path="/reports" element={<Reports t={t} />} />}
                  {isAdmin && <Route path="/fees"    element={<Fees session={session} />} />}
                  {isAdmin && <Route path="/import" element={<Importer />} />}
                  {isAdmin && <Route path="/manual-receipt" element={<ManualReceipt session={session} />} />}
                  <Route path="*" element={<Navigate to="/scanner" replace />} />
                </Routes>
                <Navbar t={t} isAdmin={isAdmin} session={session} onLogout={handleLogout} />
              </div>
            )
        } />
      </Routes>
    </BrowserRouter>
  )
}