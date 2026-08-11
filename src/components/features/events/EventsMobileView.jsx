import { useState } from 'react'
import EventList from './EventList'
import EventForm from './EventForm'

export default function EventsMobileView({
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
        events={events}
        branches={branches}
        loading={loading}
        isToday={isToday}
        isUpcoming={isUpcoming}
        isPast={isPast}
        onDelete={removeEvent}
      />

      {showForm && (
        <EventForm branches={branches} saving={saving} onSave={handleSave} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
