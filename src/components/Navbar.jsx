import { NavLink } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { MdOutlineQrCodeScanner, MdOutlineDashboard, MdOutlinePeople, MdOutlineCalendarMonth, MdOutlineEventNote, MdOutlineLogout, MdOutlineSettings } from 'react-icons/md'

export default function Navbar({ t, isAdmin, session, onLogout }) {
  const navRef = useRef(null)

  useEffect(() => {
    function syncHeight() {
      if (navRef.current) {
        const height = navRef.current.offsetHeight
        document.documentElement.style.setProperty('--navbar-height', `${height}px`)
      }
    }
    syncHeight()
    window.addEventListener('resize', syncHeight)
    return () => window.removeEventListener('resize', syncHeight)
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
    <nav ref={navRef} className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--nav-bg)] border-t border-border">
      <div className="flex">
        {LINKS.map(link => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 pb-3 gap-0.5 text-[10px] tracking-wide no-underline border-t-2 transition-all duration-150 ${
                  isActive ? 'text-present border-present' : 'text-muted border-transparent'
                }`
              }
            >
              <Icon size={20} />
              <span>{t(link.key)}</span>
            </NavLink>
          )
        })}

        <button onClick={onLogout}
          className="flex-1 flex flex-col items-center justify-center py-2 pb-3 gap-0.5 text-[10px] tracking-wide text-absent bg-transparent border-0 border-t-2 border-transparent cursor-pointer">
          <MdOutlineLogout size={20} />
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  )
}
