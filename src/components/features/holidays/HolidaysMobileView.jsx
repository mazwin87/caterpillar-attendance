import { useState } from 'react'
import { Spinner, Button } from '../../ui'
import StudentLeaveList from './StudentLeaveList'
import SchoolClosureList from './SchoolClosureList'
import AddLeaveForm from './AddLeaveForm'
import AddClosureForm from './AddClosureForm'

export default function HolidaysMobileView({
  isAdmin,
  holidays, closures, students, branches,
  loading, saving,
  isActive, isUpcoming,
  addHoliday, removeHoliday,
  addClosure, removeClosure,
}) {
  const [activeTab, setActiveTab]           = useState('holidays')
  const [showLeaveForm, setShowLeaveForm]   = useState(false)
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

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 80 }}>
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Time Off</div>
          {canAdd && (
            <Button
              onClick={() => activeTab === 'holidays' ? setShowLeaveForm(true) : setShowClosureForm(true)}
              style={{ borderRadius: 20, padding: '8px 16px', fontSize: 13 }}
            >
              + Add
            </Button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[{ key: 'holidays', label: 'Student Leave' }, { key: 'closures', label: 'School Closures' }].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 0', fontSize: 13, fontWeight: 500,
                color: activeTab === tab.key ? 'var(--present)' : 'var(--muted)',
                borderBottom: activeTab === tab.key ? '2px solid var(--present)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spinner /></div>
        ) : activeTab === 'holidays' ? (
          <StudentLeaveList holidays={holidays} isActive={isActive} onDelete={handleDeleteLeave} />
        ) : (
          <SchoolClosureList closures={closures} isUpcoming={isUpcoming} isAdmin={isAdmin} onDelete={handleDeleteClosure} />
        )}
      </div>

      {showLeaveForm && (
        <AddLeaveForm students={students} branches={branches} saving={saving} onSave={handleAddLeave} onClose={() => setShowLeaveForm(false)} />
      )}
      {showClosureForm && (
        <AddClosureForm saving={saving} onSave={handleAddClosure} onClose={() => setShowClosureForm(false)} />
      )}
    </div>
  )
}
