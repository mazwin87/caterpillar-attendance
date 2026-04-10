import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/scanner',   icon: '📷', key: 'nav_scanner' },
  { to: '/dashboard', icon: '📊', key: 'nav_dashboard' },
  { to: '/students',  icon: '👦', key: 'nav_students' },
  { to: '/holidays',  icon: '🏖️', key: 'nav_holidays' },
  { to: '/events',    icon: '🎉', key: 'nav_events' },
  { to: '/reports',   icon: '📋', key: 'nav_reports' },
]

export default function Navbar({ t }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'var(--nav-bg)',
      borderTop: '0.5px solid var(--border)',
      display: 'flex',
    }}>
      <style>{`
        :root {
          --bg: #f8f8f6;
          --surface: #ffffff;
          --border: #e8e8e4;
          --text: #1a1a1a;
          --muted: #888888;
          --hint: #aaaaaa;
          --nav-bg: #ffffff;
          --present: #2d7a4f;
          --late: #9a6b1a;
          --absent: #b03030;
          --holiday: #4a6fa5;
          --present-bg: #eef6f1;
          --late-bg: #fdf4e7;
          --absent-bg: #fdeaea;
          --holiday-bg: #edf1f8;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #1c1c1e;
            --surface: #2a2a2e;
            --border: #3a3a3e;
            --text: #f0f0f0;
            --muted: #888888;
            --hint: #555555;
            --nav-bg: #2a2a2e;
            --present: #5a9e78;
            --late: #c49040;
            --absent: #c05050;
            --holiday: #7088c0;
            --present-bg: #1e2e24;
            --late-bg: #2e2614;
            --absent-bg: #2e1a1a;
            --holiday-bg: #1a2030;
          }
        }
      `}</style>
      {LINKS.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 0 14px',
            gap: 3,
            fontSize: 10,
            letterSpacing: '0.03em',
            color: isActive ? 'var(--present)' : 'var(--muted)',
            textDecoration: 'none',
            borderTop: isActive ? '2px solid var(--present)' : '2px solid transparent',
            transition: 'all 0.15s',
          })}
        >
          <span style={{ fontSize: 16 }}>{link.icon}</span>
          <span>{t(link.key)}</span>
        </NavLink>
      ))}
    </nav>
  )
}