import { NavLink } from 'react-router-dom'
import { MdOutlineQrCodeScanner, MdOutlineDashboard, MdOutlinePeople, MdOutlineCalendarMonth, MdOutlineEventNote, MdOutlineLogout, MdOutlineSettings } from 'react-icons/md'
import Navbar from './Navbar'

export default function AppShell({ t, isAdmin, session, onLogout, children }) {
  const LINKS = [
    { to: '/scanner',   icon: MdOutlineQrCodeScanner, key: 'nav_scanner' },
    { to: '/dashboard', icon: MdOutlineDashboard,     key: 'nav_dashboard' },
    { to: '/students',  icon: MdOutlinePeople,        key: 'nav_students' },
    { to: '/holidays',  icon: MdOutlineCalendarMonth, key: 'nav_holidays' },
    { to: '/events',    icon: MdOutlineEventNote,     key: 'nav_events' },
    ...(isAdmin ? [{ to: '/admin', icon: MdOutlineSettings, key: 'nav_admin' }] : []),
  ]

  return (
    <div className="min-h-screen bg-page">

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-50 bg-surface border-r border-border py-5 px-3.5"
        style={{ width: 'var(--sidebar-width)' }}
      >
        <div className="flex items-center gap-2.5 px-2.5 py-1 mb-6">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="w-[30px] h-[30px] object-contain flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink leading-tight">Caterpillar Playtime</div>
            <div className="text-[11px] text-muted">Attendance</div>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {LINKS.map(link => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm no-underline transition-colors duration-150 ${
                    isActive ? 'text-primary bg-primary-bg font-medium' : 'text-muted bg-transparent font-normal'
                  }`
                }
              >
                <Icon size={19} />
                {t(link.key)}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-3">
          {session?.teacherName && (
            <div className="px-3 pb-2.5 text-xs text-muted overflow-hidden text-ellipsis whitespace-nowrap">
              {session.teacherName}
            </div>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-sm text-absent bg-transparent border-0 cursor-pointer text-left"
          >
            <MdOutlineLogout size={19} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content area — offset right of sidebar on desktop */}
      <div className="min-h-screen lg:pl-[var(--sidebar-width)]">
        {children}
      </div>

      {/* Mobile bottom tab bar */}
      <Navbar t={t} isAdmin={isAdmin} session={session} onLogout={onLogout} />
    </div>
  )
}
