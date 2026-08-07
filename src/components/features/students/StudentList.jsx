import { AGE_GROUP_LABELS } from '../../../lib/constants/ageGroups'
import { shortBranchName } from '../../../lib/constants/branches'

export default function StudentList({ students, attendanceMap, openMenu, setOpenMenu, onEdit, onDelete, onViewQR, onCopyTelegramLink }) {
  if (students.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 48 }}>No students found</div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {students.map(s => {
        const ageLabel = AGE_GROUP_LABELS[s.age_group] || s.age_group
        const tgLinked = s.parents?.telegram_chat_id
        const isOpen   = openMenu === s.id

        return (
          <div key={s.id}
            style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--present-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: 'var(--present)', flexShrink: 0 }}>
                {s.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, flexShrink: 0, background: tgLinked ? 'var(--present-bg)' : 'var(--absent-bg)', color: tgLinked ? 'var(--present)' : 'var(--absent)' }}>
                    {tgLinked ? '● Linked' : '○ Unlinked'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {s.student_no} · {shortBranchName(s.branches?.name)}
                  </span>
                  {ageLabel && (
                    <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)', fontWeight: 500, flexShrink: 0 }}>
                      {ageLabel}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setOpenMenu(isOpen ? null : s.id) }}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', background: isOpen ? 'var(--border)' : 'var(--bg)', border: '0.5px solid var(--border)', color: isOpen ? 'var(--text)' : 'var(--muted)' }}>
                Actions
              </button>
            </div>

            {isOpen && (
              <div style={{ marginTop: 10, borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button onClick={() => onCopyTelegramLink(s.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                    <span style={{ fontSize: 16 }}>📱</span> Telegram
                  </button>
                  <button onClick={() => onViewQR(s)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                    <span style={{ fontSize: 16 }}>🔲</span> View QR
                  </button>
                  <button onClick={() => onEdit(s)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                    <span style={{ fontSize: 16 }}>✏️</span> Edit
                  </button>
                  <button onClick={() => onDelete(s.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--absent)', background: 'var(--absent-bg)', cursor: 'pointer', fontSize: 13, color: 'var(--absent)' }}>
                    <span style={{ fontSize: 16 }}>🗑️</span> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
