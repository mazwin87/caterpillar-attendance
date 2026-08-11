import { useState } from 'react'
import { Modal, Input, Select, Button } from '../../ui'
import { AGE_OPTIONS } from '../../../lib/constants/ageGroups'

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 2px' }}>
      <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
      <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
    </div>
  )
}

const ADD_DEFAULTS = {
  name: '', student_no: '', branch_id: '', age_group: '',
  parent_name: '', parent_phone: '', parent_email: '', date_of_birth: '', monthly_fee: '',
}

const EDIT_FIELDS = ['name', 'age_group', 'date_of_birth', 'monthly_fee']

// mode: 'add' | 'edit'
export default function StudentForm({ mode = 'add', initialData = {}, branches = [], saving, onSave, onClose, onBranchSelect, variant = 'bottom' }) {
  const defaults = mode === 'add' ? ADD_DEFAULTS : Object.fromEntries(EDIT_FIELDS.map(k => [k, initialData[k] ?? '']))
  const [form, setForm]     = useState(defaults)
  const [errors, setErrors] = useState({})

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  async function handleBranchChange(branchId) {
    const studentNo = onBranchSelect ? await onBranchSelect(branchId) : ''
    setForm(f => ({ ...f, branch_id: branchId, student_no: studentNo, age_group: '' }))
    setErrors(e => ({ ...e, branch_id: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (mode === 'add') {
      const errs = {}
      if (!form.name.trim())         errs.name          = 'Required'
      if (!form.branch_id)           errs.branch_id     = 'Required'
      if (!form.age_group)           errs.age_group     = 'Required'
      if (!form.date_of_birth)       errs.date_of_birth = 'Required'
      if (!form.monthly_fee)         errs.monthly_fee   = 'Required'
      if (!form.parent_name.trim())  errs.parent_name   = 'Required'
      if (!form.parent_phone.trim()) errs.parent_phone  = 'Required'
      if (Object.keys(errs).length) { setErrors(errs); return }
    }
    await onSave(form)
  }

  return (
    <Modal onClose={onClose} variant={variant}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>
          {mode === 'add' ? 'Add student' : 'Edit student'}
        </div>
        <Button variant="ghost" onClick={onClose} style={{ fontSize: 22, padding: 4, lineHeight: 1 }}>×</Button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {mode === 'add' && <Divider label="Student info" />}

        <Input
          value={form.name}
          onChange={e => setField('name', e.target.value)}
          placeholder="Full name"
          error={errors.name ? '⚠️ Student name is required' : undefined}
        />

        {mode === 'add' && (
          <>
            <Select
              value={form.branch_id}
              onChange={e => handleBranchChange(e.target.value)}
              error={errors.branch_id ? '⚠️ Please select a branch' : undefined}
            >
              <option value="">Select branch</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>

            <div style={{ position: 'relative' }}>
              <Input
                value={form.student_no}
                readOnly
                placeholder="Student ID — select branch first"
                style={{ color: 'var(--muted)', background: 'var(--border)', paddingRight: 70 }}
              />
              {form.student_no && (
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--present)', background: 'var(--present-bg)', padding: '2px 8px', borderRadius: 10 }}>Auto</span>
              )}
            </div>
          </>
        )}

        <Select
          value={form.age_group}
          onChange={e => setField('age_group', e.target.value)}
          error={errors.age_group ? '⚠️ Please select an age group' : undefined}
        >
          <option value="">Select age group</option>
          {AGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>

        <Input
          label="Date of birth"
          type="date"
          value={form.date_of_birth}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => setField('date_of_birth', e.target.value)}
          error={errors.date_of_birth ? '⚠️ Please enter date of birth' : undefined}
        />

        <Input
          label="Monthly fee (RM)"
          type="number"
          step="0.01"
          value={form.monthly_fee || ''}
          onChange={e => setField('monthly_fee', e.target.value)}
          placeholder="0.00"
          error={errors.monthly_fee ? '⚠️ Please enter monthly fee' : undefined}
        />

        {mode === 'edit' && (
          <div style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--holiday)' }}>
            Student ID and branch cannot be changed after registration.
          </div>
        )}

        {mode === 'add' && (
          <>
            <Divider label="Parent info" />
            <Input
              value={form.parent_name}
              onChange={e => setField('parent_name', e.target.value)}
              placeholder="Parent / guardian name"
              error={errors.parent_name ? '⚠️ Parent name is required' : undefined}
            />
            <Input
              value={form.parent_phone}
              type="tel"
              onChange={e => setField('parent_phone', e.target.value)}
              placeholder="Phone number e.g. 012-345 6789"
              error={errors.parent_phone ? '⚠️ Phone number is required' : undefined}
            />
            <Input
              value={form.parent_email}
              type="email"
              onChange={e => setField('parent_email', e.target.value)}
              placeholder="Email (optional)"
            />
          </>
        )}

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
