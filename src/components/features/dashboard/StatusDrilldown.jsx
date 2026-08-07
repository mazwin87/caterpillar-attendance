import { STATUS } from '../../../lib/constants/attendance'
import { shortBranchName } from '../../../lib/constants/branches'
import { Spinner, EmptyState, Button } from '../../ui'

export default function StatusDrilldown({
  activeStatus, activeBranch, students, loadingStudents,
  isAdmin, overrideStudent, setOverrideStudent, onOverride, onClose,
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS[activeStatus].color }} />
          <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
            {STATUS[activeStatus].label} {activeBranch ? `· ${shortBranchName(activeBranch)}` : '· All branches'}
          </span>
        </div>
        <Button variant="ghost" onClick={onClose} style={{ fontSize: 18, padding: 2, lineHeight: 1 }}>×</Button>
      </div>

      {loadingStudents ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spinner />
        </div>
      ) : students.length === 0 ? (
        <EmptyState>No students</EmptyState>
      ) : students.map((a, i) => (
        <div key={a.id}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderBottom: overrideStudent === a.id ? 'none' : i < students.length - 1 ? '0.5px solid var(--border)' : 'none',
            cursor: isAdmin ? 'pointer' : 'default',
            background: overrideStudent === a.id ? 'var(--bg)' : 'transparent',
          }}
            onClick={() => isAdmin && setOverrideStudent(overrideStudent === a.id ? null : a.id)}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: STATUS[a.status]?.bg || STATUS[activeStatus].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: STATUS[a.status]?.color || STATUS[activeStatus].color, flexShrink: 0 }}>
              {a.students?.name?.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.students?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{a.students?.student_no} · {shortBranchName(a.students?.branches?.name)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: STATUS[a.status]?.bg || STATUS[activeStatus].bg, color: STATUS[a.status]?.color || STATUS[activeStatus].color, fontWeight: 500 }}>
                {a.status}
              </span>
              {a.scanned_at && (
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {new Date(a.scanned_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {a.absence_reason && (
                <span style={{ fontSize: 10, color: 'var(--absent)', textTransform: 'capitalize' }}>
                  {a.absence_reason.replace('_', ' ')}
                </span>
              )}
              {activeStatus === 'ABSENT' && !a.absence_reason && (
                <span style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>no reason yet</span>
              )}
            </div>
          </div>

          {overrideStudent === a.id && isAdmin && (
            <div style={{ padding: '8px 16px 12px', borderBottom: i < students.length - 1 ? '0.5px solid var(--border)' : 'none', background: 'var(--bg)' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Change status to:</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(STATUS).filter(([key]) => key !== 'HOLIDAY').map(([key, cfg]) => (
                  <button key={key}
                    onClick={() => onOverride(a.id, key)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      background: a.status === key ? cfg.bg : 'var(--surface)',
                      color: a.status === key ? cfg.color : 'var(--muted)',
                      border: `0.5px solid ${a.status === key ? cfg.color : 'var(--border)'}`,
                      fontWeight: a.status === key ? 500 : 400,
                      opacity: a.status === key ? 1 : 0.8,
                    }}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
