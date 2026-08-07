import { useState } from 'react'
import { AGE_GROUP_LABELS } from '../../../lib/constants/ageGroups'
import { shortBranchName } from '../../../lib/constants/branches'
import { EmptyState, Spinner } from '../../ui'

export default function EventList({ events, branches, loading, isToday, isUpcoming, isPast, onDelete }) {
  const [openMenu, setOpenMenu] = useState(null)

  function branchName(id) {
    return shortBranchName(branches.find(b => b.id === id)?.name) || id
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spinner /></div>
  if (events.length === 0) return <EmptyState>No events yet</EmptyState>

  return (
    <div
      style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
      onClick={() => setOpenMenu(null)}
    >
      {events.map(ev => {
        const isOpen = openMenu === ev.id
        return (
          <div
            key={ev.id}
            style={{
              background: 'var(--surface)',
              border: `0.5px solid ${isToday(ev) ? 'var(--present)' : 'var(--border)'}`,
              borderRadius: 12, padding: '14px 16px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{ev.name}</div>
                  {isToday(ev) && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--present-bg)', color: 'var(--present)', fontWeight: 500 }}>Today</span>
                  )}
                  {isUpcoming(ev) && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)', fontWeight: 500 }}>Upcoming</span>
                  )}
                  {isPast(ev) && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--bg)', color: 'var(--muted)' }}>Past</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                  {new Date(ev.date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setOpenMenu(isOpen ? null : ev.id) }}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 8, transition: 'all 0.15s',
                  background: isOpen ? 'var(--border)' : 'var(--bg)',
                  border: '0.5px solid var(--border)',
                  color: isOpen ? 'var(--text)' : 'var(--muted)',
                }}
              >
                Actions
              </button>
            </div>

            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Branches</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {ev.branches.map(id => (
                  <span key={id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--present-bg)', color: 'var(--present)' }}>
                    {branchName(id)}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Age groups</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {ev.age_groups.map(g => (
                  <span key={g} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)' }}>
                    {AGE_GROUP_LABELS[g] || g}
                  </span>
                ))}
              </div>
            </div>

            {isOpen && (
              <div style={{ marginTop: 10, borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
                <button
                  onClick={() => { setOpenMenu(null); onDelete(ev.id) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--absent)', background: 'var(--absent-bg)', cursor: 'pointer', fontSize: 13, color: 'var(--absent)', width: '100%' }}
                >
                  <span style={{ fontSize: 16 }}>🗑️</span> Delete
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
