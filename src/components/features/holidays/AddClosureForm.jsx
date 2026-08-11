import { useState } from 'react'
import { Modal, Input, Button } from '../../ui'

const DEFAULTS = { date: '', end_date: '', label: '' }

export default function AddClosureForm({ saving, onSave, onClose, variant = 'bottom' }) {
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
    <Modal onClose={onClose} variant={variant}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Add school closure</div>
        <Button variant="ghost" onClick={onClose} style={{ fontSize: 22, padding: 4, lineHeight: 1 }}>×</Button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Input
          required
          value={form.label}
          onChange={e => setField('label', e.target.value)}
          placeholder="e.g. Hari Raya Aidilfitri"
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Input
            label="Start date"
            required
            type="date"
            value={form.date}
            onChange={e => setField('date', e.target.value)}
          />
          <Input
            label="End date"
            required
            type="date"
            value={form.end_date}
            onChange={e => setField('end_date', e.target.value)}
          />
        </div>

        <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--absent)', lineHeight: 1.6 }}>
          On this date the system will NOT mark anyone absent or send notifications.
        </div>

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
