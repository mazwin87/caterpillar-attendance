import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MobileShell from './components/layout/MobileShell'
import DesktopShell from './components/layout/DesktopShell'
import { useMediaQuery } from './hooks/useMediaQuery'
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
import { getSession, clearSession, updateSession } from './lib/auth'
import { supabase } from './lib/supabase'
import ManualReceipt from './components/ManualReceipt'
import ChangePassword from './components/ChangePassword'
import ManageUsers from './components/ManageUsers'

export default function App() {
  const { lang, setLang, t } = useLanguage()
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    const s = getSession()
    setSession(s)
    setChecking(false)

    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = midnight - now
    const midnightTimer = setTimeout(() => {
      supabase.auth.signOut()
      clearSession()
      setSession(null)
    }, msUntilMidnight)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearSession()
        setSession(null)
      }
    })

    return () => {
      clearTimeout(midnightTimer)
      subscription.unsubscribe()
    }
  }, [])

  function handleLogin(user, teacherName) {
    setSession({ ...user, teacherName })
  }

  function handlePasswordChanged() {
    updateSession({ must_change_password: false })
    setSession(prev => ({ ...prev, must_change_password: false }))
  }

  function handleLogout() {
    supabase.auth.signOut()
    clearSession()
    setSession(null)
  }

  if (checking) return <div style={{ color: 'white' }}>Loading...</div>

  const isAdmin = session?.role === 'admin' || session?.role === 'superadmin'

  return (
    <BrowserRouter basename="/cpcc">
      <Routes>
        {/* Public route — no auth needed */}
        <Route path="/receipt/:id" element={<Receipt />} />

        {/* All protected routes */}
        <Route path="*" element={
          !session
            ? <Login onLogin={handleLogin} />
            : session.must_change_password
            ? <ChangePassword session={session} onDone={handlePasswordChanged} />
            : (() => {
                const Shell = isDesktop ? DesktopShell : MobileShell
                return (
                  <Shell t={t} isAdmin={isAdmin} session={session} onLogout={handleLogout}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/scanner" replace />} />
                      <Route path="/scanner"   element={<Scanner lang={lang} setLang={setLang} t={t} session={session} />} />
                      <Route path="/dashboard" element={<Dashboard t={t} session={session} isAdmin={isAdmin} onLogout={handleLogout} />} />
                      <Route path="/students"  element={<Students t={t} session={session} />} />
                      <Route path="/holidays"  element={<Holidays t={t} isAdmin={isAdmin} />} />
                      <Route path="/events"    element={<Events t={t} />} />
                      {isAdmin && <Route path="/admin"          element={<Admin session={session} />} />}
                      {isAdmin && <Route path="/reports"        element={<Reports t={t} />} />}
                      {isAdmin && <Route path="/fees"           element={<Fees session={session} />} />}
                      {isAdmin && <Route path="/import"         element={<Importer session={session} />} />}
                      {isAdmin && <Route path="/manual-receipt" element={<ManualReceipt session={session} />} />}
                      {isAdmin && <Route path="/manage-users"   element={<ManageUsers session={session} />} />}
                      <Route path="*" element={<Navigate to="/scanner" replace />} />
                    </Routes>
                  </Shell>
                )
              })()
        } />
      </Routes>
    </BrowserRouter>
  )
}