import { useState } from 'react'
import { PageHeader, Button, Spinner, EmptyState } from '../../ui'
import { AGE_GROUP_LABELS } from '../../../lib/constants/ageGroups'
import { shortBranchName } from '../../../lib/constants/branches'
import EventForm from './EventForm'

function EventCard({ ev, branches, isToday, isUpcoming, onDelete }) {
  function branchLabel(id) {
    return shortBranchName(branches.find(b => b.id === id)?.name) || id
  }

  const today    = isToday(ev)
  const upcoming = isUpcoming(ev)
  const accentColor = today ? 'var(--present)' : upcoming ? 'var(--holiday)' : 'var(--border)'

  return (
    <div style={{
      background: 'var(--surface)',
      border: `0.5px solid ${today ? 'var(--present)' : 'var(--border)'}`,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: 14, padding: '20px 20px 16px',
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative',
    }}>
      {/* Status badge */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        {today && (
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--present-bg)', color: 'var(--present)', fontWeight: 600 }}>Today</span>
        )}
        {upcoming && (
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)', fontWeight: 500 }}>Upcoming</span>
        )}
        {!today && !upcoming && (
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--bg)', color: 'var(--muted)' }}>Past</span>
        )}
      </div>

      {/* Name + date */}
      <div style={{ paddingRight: 72 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>
          {ev.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {new Date(ev.date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Branches */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Branches</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {ev.branches.map(id => (
            <span key={id} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--present-bg)', color: 'var(--present)', fontWeight: 500 }}>
              {branchLabel(id)}
            </span>
          ))}
        </div>
      </div>

      {/* Age groups */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Age Groups</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {ev.age_groups.map(g => (
            <span key={g} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)' }}>
              {AGE_GROUP_LABELS[g] || g}
            </span>
          ))}
        </div>
      </div>

      {/* Delete */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <button
          onClick={() => onDelete(ev.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--muted)', padding: '4px 8px',
            borderRadius: 6, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--absent)'; e.currentTarget.style.background = 'var(--absent-bg)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'none' }}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  )
}

export default function EventsDesktopView({
  events, branches, loading, saving,
  isToday, isUpcoming, isPast,
  addEvent, removeEvent,
}) {
  const [showForm, setShowForm] = useState(false)

  async function handleSave(form) {
    await addEvent(form)
    setShowForm(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <PageHeader
        title="Events"
        actions={
          <Button onClick={() => setShowForm(true)} style={{ borderRadius: 20, padding: '8px 16px', fontSize: 13 }}>
            + Add
          </Button>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 64 }}><Spinner /></div>
        ) : events.length === 0 ? (
          <EmptyState>No events yet</EmptyState>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {events.map(ev => (
              <EventCard
                key={ev.id}
                ev={ev}
                branches={branches}
                isToday={isToday}
                isUpcoming={isUpcoming}
                onDelete={removeEvent}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <EventForm branches={branches} saving={saving} onSave={handleSave} onClose={() => setShowForm(false)} variant="center" />
      )}
    </div>
  )
}
