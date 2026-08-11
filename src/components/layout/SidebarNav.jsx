import { NavLink } from 'react-router-dom'
import {
  MdOutlineQrCodeScanner, MdOutlineDashboard, MdOutlinePeople,
  MdOutlineCalendarMonth, MdOutlineEventNote, MdOutlineSettings,
  MdOutlineBarChart, MdOutlinePayments, MdOutlineUploadFile,
  MdOutlineReceipt, MdOutlineManageAccounts, MdOutlineLogout,
} from 'react-icons/md'

const LINK_STYLE = (isActive) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 16px', borderRadius: 8, margin: '1px 8px',
  fontSize: 13, fontWeight: 500, textDecoration: 'none',
  color: isActive ? 'var(--present)' : 'var(--text)',
  background: isActive ? 'var(--present-bg, rgba(45,122,79,0.08))' : 'transparent',
  transition: 'background 0.1s, color 0.1s',
})

const SECTION_LABEL = {
  fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--muted)',
  padding: '16px 24px 4px',
}

function SideLink({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} style={({ isActive }) => LINK_STYLE(isActive)}>
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function SidebarNav({ t, isAdmin, session, onLogout }) {
  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 220,
      background: 'var(--surface)', borderRight: '0.5px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 50, overflowY: 'auto',
    }}>

      {/* App name */}
      <div style={{ padding: '20px 24px 12px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          Caterpillar
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Attendance</div>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, paddingTop: 8 }}>
        <div style={SECTION_LABEL}>Main</div>
        <SideLink to="/scanner"   icon={MdOutlineQrCodeScanner} label={t('nav_scanner')}   />
        <SideLink to="/dashboard" icon={MdOutlineDashboard}     label={t('nav_dashboard')} />
        <SideLink to="/students"  icon={MdOutlinePeople}        label={t('nav_students')}  />
        <SideLink to="/holidays"  icon={MdOutlineCalendarMonth} label={t('nav_holidays')}  />
        <SideLink to="/events"    icon={MdOutlineEventNote}     label={t('nav_events')}    />

        {isAdmin && (
          <>
            <div style={SECTION_LABEL}>Admin</div>
            <SideLink to="/reports"        icon={MdOutlineBarChart}       label="Reports"        />
            <SideLink to="/fees"           icon={MdOutlinePayments}       label="Fees"           />
            <SideLink to="/import"         icon={MdOutlineUploadFile}     label="Import"         />
            <SideLink to="/manual-receipt" icon={MdOutlineReceipt}        label="Manual Receipt" />
            <SideLink to="/manage-users"   icon={MdOutlineManageAccounts} label="Manage Users"   />
            <SideLink to="/admin"          icon={MdOutlineSettings}       label="Settings"       />
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '12px 8px', borderTop: '0.5px solid var(--border)' }}>
        <div style={{ padding: '6px 16px 10px', fontSize: 12, color: 'var(--muted)' }}>
          <div style={{ fontWeight: 500, color: 'var(--text)' }}>{session?.username}</div>
          <div style={{ marginTop: 1 }}>{session?.role}</div>
        </div>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '9px 16px', borderRadius: 8, margin: '1px 0',
            fontSize: 13, fontWeight: 500, color: 'var(--absent)',
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          }}
        >
          <MdOutlineLogout size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
