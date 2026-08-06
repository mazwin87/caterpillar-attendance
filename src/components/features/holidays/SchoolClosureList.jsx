import { useState } from 'react'
import { EmptyState, Button } from '../../ui'

export default function SchoolClosureList({ closures, isUpcoming, isAdmin, onDelete }) {
  const [openMenu, setOpenMenu] = useState(null)

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      onClick={() => setOpenMenu(null)}
    >
      <div style={{ fontSize: 12, color: 'var(--muted)', padding: '4px 0 8px' }}>
        On these days the cron will not run — no absent marking or notifications will be sent.
      </div>

      {closures.length === 0 ? (
        <EmptyState>No school closures added</EmptyState>
      ) : closures.map(c => {
        const isOpen = openMenu === c.id
        const upcoming = isUpcoming(c)
        return (
          <div
            key={c.id}
            style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{c.label}</div>
                <div style={{ fontSize: 12, color: upcoming ? 'var(--holiday)' : 'var(--muted)', marginTop: 4 }}>
                  {c.end_date && c.end_date !== c.date
                    ? `${new Date(c.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })} — ${new Date(c.end_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : new Date(c.date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  }
                </div>
              </div>
              {upcoming && (
                <span style={{ background: 'var(--holiday-bg)', color: 'var(--holiday)', fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 500, flexShrink: 0 }}>
                  Upcoming
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={e => { e.stopPropagation(); setOpenMenu(isOpen ? null : c.id) }}
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
              )}
            </div>

            {isOpen && isAdmin && (
              <div style={{ marginTop: 10, borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
                <Button
                  onClick={() => { setOpenMenu(null); onDelete(c.id) }}
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
