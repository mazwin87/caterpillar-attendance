import { useState } from 'react'
import { EmptyState, Button } from '../../ui'
import { shortBranchName } from '../../../lib/constants/branches'

export default function StudentLeaveList({ holidays, isActive, onDelete }) {
  const [openMenu, setOpenMenu] = useState(null)

  if (holidays.length === 0) {
    return <EmptyState>No student leave recorded</EmptyState>
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      onClick={() => setOpenMenu(null)}
    >
      {holidays.map(h => {
        const isOpen = openMenu === h.id
        return (
          <div
            key={h.id}
            style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.students?.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {h.students?.student_no} · {shortBranchName(h.branches?.name)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--holiday)', marginTop: 6 }}>
                  {h.start_date} → {h.end_date}
                </div>
                {h.reason && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{h.reason}</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {isActive(h) && (
                  <span style={{ background: 'var(--holiday-bg)', color: 'var(--holiday)', fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
                    Active
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); setOpenMenu(isOpen ? null : h.id) }}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.15s',
                    background: isOpen ? 'var(--border)' : 'var(--bg)',
                    border: '0.5px solid var(--border)',
                    color: isOpen ? 'var(--text)' : 'var(--muted)',
                  }}
                >
                  Actions
                </button>
              </div>
            </div>

            {isOpen && (
              <div style={{ marginTop: 10, borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
                <Button
                  variant="danger"
                  onClick={() => { setOpenMenu(null); onDelete(h.id) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', borderRadius: 8, fontSize: 13,
                    background: 'var(--absent-bg)', color: 'var(--absent)',
                    border: '0.5px solid var(--absent)', width: '100%',
                  }}
                >
                  <span style={{ fontSize: 16 }}>🗑️</span> Delete
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
