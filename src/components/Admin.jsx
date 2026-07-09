import { useNavigate } from 'react-router-dom'
import { MdOutlineAssessment, MdOutlineReceipt, MdOutlineUploadFile, MdOutlineReceiptLong, MdOutlineManageAccounts } from 'react-icons/md'

export default function Admin({ session }) {
  const navigate = useNavigate()

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

  return (
    <div className="min-h-full bg-page" style={{ paddingBottom: 'var(--navbar-height)' }}>
      <div className="pt-[52px] lg:pt-8 bg-surface border-b border-border pb-5 px-5">
       <div className="lg:max-w-5xl lg:mx-auto">
        <div className="text-[11px] text-muted tracking-[0.08em] uppercase mb-1">Admin Panel</div>
        <div className="text-[22px] font-medium text-ink">Tools & Reports</div>
       </div>
      </div>
      <div className="lg:max-w-5xl lg:mx-auto grid grid-cols-1 lg:grid-cols-2 gap-3 p-4 py-5">
        {tools.map(tool => {
          const Icon = tool.icon
          return (
            <button key={tool.to} onClick={() => navigate(tool.to)}
              className="bg-surface border border-border rounded-2xl p-5 text-left cursor-pointer w-full flex items-center gap-4 transition-all duration-150">
              <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: tool.bg }}>
                <Icon size={26} color={tool.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium text-ink mb-1">{tool.title}</div>
                <div className="text-xs text-muted leading-relaxed">{tool.desc}</div>
              </div>
              <div className="text-lg text-muted flex-shrink-0">›</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
