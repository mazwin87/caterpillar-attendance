import { useState } from 'react'
import { Spinner, Button } from '../../ui'
import { useHolidays } from '../../../hooks/useHolidays'
import StudentLeaveList from './StudentLeaveList'
import SchoolClosureList from './SchoolClosureList'
import AddLeaveForm from './AddLeaveForm'
import AddClosureForm from './AddClosureForm'

export default function HolidaysPage({ isAdmin }) {
  const hook = useHolidays()
  const [activeTab, setActiveTab]         = useState('holidays')
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [showClosureForm, setShowClosureForm] = useState(false)

  async function handleAddLeave(form) {
    try {
      await hook.addHoliday(form)
      setShowLeaveForm(false)
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleAddClosure(form) {
    try {
      await hook.addClosure(form)
      setShowClosureForm(false)
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeleteLeave(id) {
    if (!window.confirm('Delete this student leave?')) return
    try {
      await hook.removeHoliday(id)
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeleteClosure(id) {
    if (!window.confirm('Remove this school closure?')) return
    try {
      await hook.removeClosure(id)
    } catch (err) {
      alert(err.message)
    }
  }

  const canAdd = activeTab === 'holidays' || (activeTab === 'closures' && isAdmin)

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 80 }}>

      {/* Header */}
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { key: 'holidays', label: 'Student Leave' },
            { key: 'closures', label: 'School Closures' },
          ].map(tab => (
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

      {/* Content */}
      <div style={{ padding: '12px 16px' }}>
        {hook.loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spinner />
          </div>
        ) : activeTab === 'holidays' ? (
          <StudentLeaveList
            holidays={hook.holidays}
            isActive={hook.isActive}
            onDelete={handleDeleteLeave}
          />
        ) : (
          <SchoolClosureList
            closures={hook.closures}
            isUpcoming={hook.isUpcoming}
            isAdmin={isAdmin}
            onDelete={handleDeleteClosure}
          />
        )}
      </div>

      {showLeaveForm && (
        <AddLeaveForm
          students={hook.students}
          branches={hook.branches}
          saving={hook.saving}
          onSave={handleAddLeave}
          onClose={() => setShowLeaveForm(false)}
        />
      )}

      {showClosureForm && (
        <AddClosureForm
          saving={hook.saving}
          onSave={handleAddClosure}
          onClose={() => setShowClosureForm(false)}
        />
      )}
    </div>
  )
}
