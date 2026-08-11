import Navbar from '../Navbar'

export default function MobileShell({ children, t, isAdmin, session, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {children}
      <Navbar t={t} isAdmin={isAdmin} session={session} onLogout={onLogout} />
    </div>
  )
}
