import { NavLink } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { MdOutlineQrCodeScanner, MdOutlineDashboard, MdOutlinePeople, MdOutlineCalendarMonth, MdOutlineEventNote, MdOutlineLogout, MdOutlineSettings } from 'react-icons/md'

export default function Navbar({ t, isAdmin, session, onLogout }) {
  const navRef = useRef(null)

  useEffect(() => {
    if (navRef.current) {
      const height = navRef.current.offsetHeight
      document.documentElement.style.setProperty('--navbar-height', `${height}px`)
    }
  }, [])

  const LINKS = [
    { to: '/scanner',   icon: MdOutlineQrCodeScanner, key: 'nav_scanner' },
    { to: '/dashboard', icon: MdOutlineDashboard,     key: 'nav_dashboard' },
    { to: '/students',  icon: MdOutlinePeople,        key: 'nav_students' },
    { to: '/holidays',  icon: MdOutlineCalendarMonth, key: 'nav_holidays' },
    { to: '/events',    icon: MdOutlineEventNote,     key: 'nav_events' },
    ...(isAdmin ? [{ to: '/admin', icon: MdOutlineSettings, key: 'nav_admin' }] : []),
  ]

  return (
    <nav ref={navRef} style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'var(--nav-bg)',
      borderTop: '0.5px solid var(--border)',
    }}>
      <div style={{ display: 'flex' }}>
        {LINKS.map(link => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 0 12px',
                gap: 3,
                fontSize: 10,
                letterSpacing: '0.03em',
                color: isActive ? 'var(--present)' : 'var(--muted)',
                textDecoration: 'none',
                borderTop: isActive ? '2px solid var(--present)' : '2px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <Icon size={20} />
              <span>{t(link.key)}</span>
            </NavLink>
          )
        })}

        {/* Sign out */}
        <button onClick={onLogout}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '8px 0 12px', gap: 3,
            fontSize: 10, letterSpacing: '0.03em', color: 'var(--absent)',
            background: 'none', border: 'none', borderTop: '2px solid transparent',
            cursor: 'pointer',
          }}>
          <MdOutlineLogout size={20} />
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  )
}