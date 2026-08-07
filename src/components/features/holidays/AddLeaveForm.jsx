import { useState } from 'react'
import { Modal, Select, Input, Button } from '../../ui'

const DEFAULTS = { student_id: '', branch_id: '', start_date: '', end_date: '', reason: '' }

export default function AddLeaveForm({ students, branches, saving, onSave, onClose }) {
  const [form, setForm] = useState(DEFAULTS)

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await onSave(form)
    setForm(DEFAULTS)
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Add student leave</div>
        <Button variant="ghost" onClick={onClose} style={{ fontSize: 22, padding: 4, lineHeight: 1 }}>×</Button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Select
          required
          value={form.branch_id}
          onChange={e => setField('branch_id', e.target.value)}
        >
          <option value="">Select branch</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>

        <Select
          required
          value={form.student_id}
          onChange={e => setField('student_id', e.target.value)}
        >
          <option value="">Select student</option>
          {students
            .filter(s => !form.branch_id || s.branch_id === form.branch_id)
            .map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_no})</option>)}
        </Select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Input
            label="Start date"
            required
            type="date"
            value={form.start_date}
            onChange={e => setField('start_date', e.target.value)}
          />
          <Input
            label="End date"
            required
            type="date"
            value={form.end_date}
            onChange={e => setField('end_date', e.target.value)}
          />
        </div>

        <Input
          value={form.reason}
          onChange={e => setField('reason', e.target.value)}
          placeholder="Reason (optional)"
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button type="submit" disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
