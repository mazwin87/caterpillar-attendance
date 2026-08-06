import { STATUS } from '../../../lib/constants/attendance'
import { shortBranchName } from '../../../lib/constants/branches'
import { EmptyState } from '../../ui'

export default function AttendanceTable({ grouped, searched, loading }) {
  if (!searched || loading) return null

  const dates = Object.keys(grouped)

  if (dates.length === 0) {
    return <EmptyState>No records found for this period</EmptyState>
  }

  return (
    <>
      {dates.map(date => {
        const dayRecords = grouped[date]
        return (
          <div key={date} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '8px 0 6px', fontWeight: 500 }}>
              {new Date(date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              <span style={{ marginLeft: 8, color: 'var(--hint)', fontWeight: 400 }}>{dayRecords.length} records</span>
            </div>

            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {dayRecords.map((r, i) => {
                const cfg = STATUS[r.status] || {}
                return (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    borderBottom: i < dayRecords.length - 1 ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: cfg.color, flexShrink: 0 }}>
                      {r.students?.name?.charAt(0)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.students?.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                        {r.students?.student_no} · {shortBranchName(r.students?.branches?.name)}
                        {r.students?.classes?.name ? ` · ${r.students.classes.name}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontWeight: 500 }}>
                        {r.status}
                      </span>
                      {r.absence_reason && (
                        <span style={{ fontSize: 9, color: 'var(--absent)', textTransform: 'capitalize' }}>
                          {r.absence_reason.replace('_', ' ')}
                        </span>
                      )}
                      {r.scanned_at && (
                        <span style={{ fontSize: 9, color: 'var(--muted)' }}>
                          {new Date(r.scanned_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
