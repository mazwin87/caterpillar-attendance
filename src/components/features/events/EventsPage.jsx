import { useState } from 'react'
import { useEvents } from '../../../hooks/useEvents'
import EventList from './EventList'
import EventForm from './EventForm'

export default function EventsPage({ t }) {
  const ev = useEvents()
  const [showForm, setShowForm] = useState(false)

  async function handleSave(form) {
    await ev.addEvent(form)
    setShowForm(false)
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 80 }}>
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Events</div>
          <button onClick={() => setShowForm(true)}
            style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            + Add
          </button>
        </div>
      </div>

      <EventList
        events={ev.events}
        branches={ev.branches}
        loading={ev.loading}
        isToday={ev.isToday}
        isUpcoming={ev.isUpcoming}
        isPast={ev.isPast}
        onDelete={ev.removeEvent}
      />

      {showForm && (
        <EventForm
          branches={ev.branches}
          saving={ev.saving}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
