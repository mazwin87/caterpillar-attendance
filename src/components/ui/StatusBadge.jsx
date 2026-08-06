import { STATUS } from '../../lib/constants/attendance'

export default function StatusBadge({ status }) {
  const cfg = STATUS[status]
  if (!cfg) return null
  return (
    <span style={{
      display: 'inline-block',
      background: cfg.bg,
      color: cfg.color,
      borderRadius: 6,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  )
}
