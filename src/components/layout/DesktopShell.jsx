import { useEffect } from 'react'
import SidebarNav from './SidebarNav'

const SIDEBAR_WIDTH = 220

export default function DesktopShell({ children, t, isAdmin, session, onLogout }) {
  useEffect(() => {
    document.documentElement.style.setProperty('--navbar-height', '0px')
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <SidebarNav t={t} isAdmin={isAdmin} session={session} onLogout={onLogout} />
      <main style={{ marginLeft: SIDEBAR_WIDTH, flex: 1, minHeight: '100vh', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
