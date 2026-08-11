import { useState } from 'react'
import { PageHeader, Table, Button, Spinner, EmptyState } from '../../ui'
import { shortBranchName } from '../../../lib/constants/branches'
import AddLeaveForm from './AddLeaveForm'
import AddClosureForm from './AddClosureForm'

const TABS = [
  { key: 'holidays', label: 'Student Leave' },
  { key: 'closures', label: 'School Closures' },
]

export default function HolidaysDesktopView({
  isAdmin,
  holidays, closures, students, branches,
  loading, saving,
  isActive, isUpcoming,
  addHoliday, removeHoliday,
  addClosure, removeClosure,
}) {
  const [activeTab, setActiveTab]             = useState('holidays')
  const [showLeaveForm, setShowLeaveForm]     = useState(false)
  const [showClosureForm, setShowClosureForm] = useState(false)

  async function handleAddLeave(form) {
    try { await addHoliday(form); setShowLeaveForm(false) } catch (err) { alert(err.message) }
  }

  async function handleAddClosure(form) {
    try { await addClosure(form); setShowClosureForm(false) } catch (err) { alert(err.message) }
  }

  async function handleDeleteLeave(id) {
    if (!window.confirm('Delete this student leave?')) return
    try { await removeHoliday(id) } catch (err) { alert(err.message) }
  }

  async function handleDeleteClosure(id) {
    if (!window.confirm('Remove this school closure?')) return
    try { await removeClosure(id) } catch (err) { alert(err.message) }
  }

  const canAdd = activeTab === 'holidays' || (activeTab === 'closures' && isAdmin)

  const leaveColumns = [
    { key: 'student', label: 'Student', render: h => (
      <div>
        <div style={{ fontWeight: 500 }}>{h.students?.name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{h.students?.student_no}</div>
      </div>
    )},
    { key: 'branch',     label: 'Branch',     render: h => shortBranchName(h.branches?.name) },
    { key: 'start_date', label: 'Start',       render: h => h.start_date, sortable: true },
    { key: 'end_date',   label: 'End',         render: h => h.end_date },
    { key: 'reason',     label: 'Reason',      render: h => h.reason || '—' },
    { key: 'status', label: 'Status', render: h => isActive(h) ? (
      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)', fontWeight: 500 }}>
        Active
      </span>
    ) : null },
    { key: 'actions', label: '', render: h => (
      <Button variant="danger" onClick={() => handleDeleteLeave(h.id)} style={{ padding: '4px 10px', fontSize: 12 }}>
        🗑️
      </Button>
    )},
  ]

  const closureColumns = [
    { key: 'label',    label: 'Event',      render: c => c.label },
    { key: 'date',     label: 'Start Date', render: c => c.date, sortable: true },
    { key: 'end_date', label: 'End Date',   render: c => c.end_date },
    { key: 'status', label: 'Status', render: c => isUpcoming(c) ? (
      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)', fontWeight: 500 }}>
        Upcoming
      </span>
    ) : null },
    ...(isAdmin ? [{
      key: 'actions', label: '', render: c => (
        <Button variant="danger" onClick={() => handleDeleteClosure(c.id)} style={{ padding: '4px 10px', fontSize: 12 }}>
          🗑️
        </Button>
      ),
    }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <PageHeader
        title="Time Off"
        actions={canAdd ? (
          <Button
            onClick={() => activeTab === 'holidays' ? setShowLeaveForm(true) : setShowClosureForm(true)}
            style={{ borderRadius: 20, padding: '8px 16px', fontSize: 13 }}
          >
            + Add
          </Button>
        ) : null}
      />

      {/* Tab bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '0 32px', display: 'flex' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 20px', fontSize: 13, fontWeight: 500,
              color: activeTab === tab.key ? 'var(--present)' : 'var(--muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--present)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table area */}
      <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 64 }}><Spinner /></div>
        ) : activeTab === 'holidays' ? (
          holidays.length === 0
            ? <EmptyState>No student leave recorded</EmptyState>
            : <Table columns={leaveColumns} rows={holidays} />
        ) : (
          closures.length === 0
            ? <EmptyState>No school closures recorded</EmptyState>
            : <Table columns={closureColumns} rows={closures} />
        )}
      </div>

      {showLeaveForm && (
        <AddLeaveForm
          students={students} branches={branches} saving={saving}
          onSave={handleAddLeave} onClose={() => setShowLeaveForm(false)}
          variant="center"
        />
      )}
      {showClosureForm && (
        <AddClosureForm
          saving={saving}
          onSave={handleAddClosure} onClose={() => setShowClosureForm(false)}
          variant="center"
        />
      )}
    </div>
  )
}
