import { STATUS } from '../../../lib/constants/attendance'
import { BRANCH_COLORS } from '../../../lib/constants/branches'
import { EmptyState } from '../../ui'

export default function BranchSummaryGrid({ summary, activeStatus, activeBranch, onStatusClick }) {
  if (summary.length === 0) {
    return <EmptyState>No data yet for today</EmptyState>
  }

  return (
    <>
      {summary.map(branch => {
        const color = BRANCH_COLORS[branch.branch] || 'var(--present)'
        const rate  = branch.attendance_rate_pct || 0
        return (
          <div key={branch.branch} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{branch.branch}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{branch.total} students</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 500, color }}>{rate}%</div>
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 4, height: 4, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ width: `${rate}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {[
                { status: 'PRESENT', val: branch.present },
                { status: 'LATE',    val: branch.late },
                { status: 'ABSENT',  val: branch.absent },
                { status: 'HOLIDAY', val: branch.holiday },
              ].map(({ status, val }) => {
                const cfg      = STATUS[status]
                const isActive = activeStatus === status && activeBranch === branch.branch
                return (
                  <button key={status} onClick={() => onStatusClick(status, branch.branch)}
                    style={{
                      background: isActive ? cfg.bg : 'transparent',
                      border: isActive ? `1px solid ${cfg.color}` : '1px solid transparent',
                      borderRadius: 8, padding: '6px 4px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                    }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: cfg.color }}>{val ?? 0}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>{cfg.label}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
