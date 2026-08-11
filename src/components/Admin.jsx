import { useNavigate } from 'react-router-dom'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { PageHeader } from './ui'
import { MdOutlineAssessment, MdOutlineReceipt, MdOutlineUploadFile, MdOutlineReceiptLong, MdOutlineManageAccounts } from 'react-icons/md'

const tools = [
  {
    icon: MdOutlineAssessment,
    title: 'Reports',
    desc: 'View attendance history by date range and branch. Export to CSV or PDF.',
    color: '#4a6fa5',
    bg: '#edf1f8',
    to: '/reports',
  },
  {
    icon: MdOutlineReceipt,
    title: 'Fees',
    desc: 'Record monthly fee payments, generate receipts and send to parents via Telegram.',
    color: '#2d7a4f',
    bg: '#eef6f1',
    to: '/fees',
  },
  {
    icon: MdOutlineUploadFile,
    title: 'Students Importer',
    desc: 'Bulk import students, parents and fee history from a CSV file.',
    color: '#9a6b1a',
    bg: '#fdf4e7',
    to: '/import',
  },
  {
    icon: MdOutlineReceiptLong,
    title: 'Manual Receipt Generator',
    desc: 'Generate receipts for one or multiple months at once for any student.',
    color: '#7b1fa2',
    bg: '#f3e5f5',
    to: '/manual-receipt',
  },
  {
    icon: MdOutlineManageAccounts,
    title: 'Manage Users',
    desc: 'Reset passwords for admin and teacher accounts.',
    color: '#c0392b',
    bg: '#fdecea',
    to: '/manage-users',
  },
]

export default function Admin({ session }) {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
        <PageHeader title="Tools & Reports" subtitle="Admin Panel" />
        <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {tools.map(tool => {
              const Icon = tool.icon
              return (
                <button key={tool.to} onClick={() => navigate(tool.to)}
                  style={{
                    background: 'var(--surface)', border: '0.5px solid var(--border)',
                    borderRadius: 14, padding: '24px', textAlign: 'left',
                    cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 16,
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: tool.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={28} color={tool.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{tool.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{tool.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 'var(--navbar-height)' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Admin Panel</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Tools & Reports</div>
      </div>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tools.map(tool => {
          const Icon = tool.icon
          return (
            <button key={tool.to} onClick={() => navigate(tool.to)}
              style={{
                background: 'var(--surface)', border: '0.5px solid var(--border)',
                borderRadius: 14, padding: '20px', textAlign: 'left',
                cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all 0.15s',
              }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: tool.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={26} color={tool.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{tool.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{tool.desc}</div>
              </div>
              <div style={{ fontSize: 18, color: 'var(--muted)', flexShrink: 0 }}>›</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
