import { useState } from 'react'
import { PageHeader, Table, Button, Spinner, EmptyState } from '../../ui'
import { AGE_GROUP_LABELS } from '../../../lib/constants/ageGroups'
import { shortBranchName } from '../../../lib/constants/branches'
import EventForm from './EventForm'

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

  function branchLabel(id) {
    return shortBranchName(branches.find(b => b.id === id)?.name) || id
  }

  function statusBadge(ev) {
    if (isToday(ev)) return (
      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'var(--present-bg)', color: 'var(--present)', fontWeight: 500 }}>Today</span>
    )
    if (isUpcoming(ev)) return (
      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)', fontWeight: 500 }}>Upcoming</span>
    )
    return (
      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'var(--bg)', color: 'var(--muted)' }}>Past</span>
    )
  }

  const columns = [
    { key: 'name',   label: 'Event', render: ev => <div style={{ fontWeight: 500 }}>{ev.name}</div> },
    { key: 'date',   label: 'Date',  sortable: true, render: ev => (
      new Date(ev.date).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    )},
    { key: 'status', label: 'Status', render: statusBadge },
    { key: 'branches', label: 'Branches', render: ev => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {ev.branches.map(id => (
          <span key={id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--present-bg)', color: 'var(--present)' }}>
            {branchLabel(id)}
          </span>
        ))}
      </div>
    )},
    { key: 'age_groups', label: 'Age Groups', render: ev => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {ev.age_groups.map(g => (
          <span key={g} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)' }}>
            {AGE_GROUP_LABELS[g] || g}
          </span>
        ))}
      </div>
    )},
    { key: 'actions', label: '', render: ev => (
      <Button variant="danger" onClick={() => removeEvent(ev.id)} style={{ padding: '4px 10px', fontSize: 12 }}>
        🗑️
      </Button>
    )},
  ]

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
          <Table columns={columns} rows={events} />
        )}
      </div>

      {showForm && (
        <EventForm branches={branches} saving={saving} onSave={handleSave} onClose={() => setShowForm(false)} variant="center" />
      )}
    </div>
  )
}
