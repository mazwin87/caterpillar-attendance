import { useState } from 'react'
import { AGE_GROUPS, AGE_GROUP_LABELS } from '../../../lib/constants/ageGroups'
import { shortBranchName } from '../../../lib/constants/branches'
import { Modal, Input, Button } from '../../ui'

function toggleItem(arr, item) {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
}

const EMPTY_FORM = { name: '', date: '', branches: [], age_groups: [] }

export default function EventForm({ branches, saving, onSave, onClose, variant = 'bottom' }) {
  const [form, setForm] = useState(EMPTY_FORM)

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.branches.length === 0)   { alert('Select at least one branch'); return }
    if (form.age_groups.length === 0) { alert('Select at least one age group'); return }
    await onSave(form)
    setForm(EMPTY_FORM)
  }

  return (
    <Modal onClose={onClose} variant={variant}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Add event</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input
          required
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Event name e.g. Sports Day"
        />

        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Date</div>
          <Input
            required
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Branches involved</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {branches.map(b => {
              const sel = form.branches.includes(b.id)
              return (
                <button key={b.id} type="button"
                  onClick={() => setForm(f => ({ ...f, branches: toggleItem(f.branches, b.id) }))}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                    background: sel ? 'var(--present)' : 'var(--bg)',
                    color: sel ? '#fff' : 'var(--muted)',
                    border: `0.5px solid ${sel ? 'var(--present)' : 'var(--border)'}`,
                    fontWeight: sel ? 500 : 400,
                  }}>
                  {shortBranchName(b.name)}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Age groups involved</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {AGE_GROUPS.map(g => {
              const sel = form.age_groups.includes(g)
              return (
                <button key={g} type="button"
                  onClick={() => setForm(f => ({ ...f, age_groups: toggleItem(f.age_groups, g) }))}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                    background: sel ? 'var(--holiday)' : 'var(--bg)',
                    color: sel ? '#fff' : 'var(--muted)',
                    border: `0.5px solid ${sel ? 'var(--holiday)' : 'var(--border)'}`,
                    fontWeight: sel ? 500 : 400,
                  }}>
                  {AGE_GROUP_LABELS[g]}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--holiday)', lineHeight: 1.6 }}>
          On event day the scanner will only accept students from selected branches and age groups. The "Run now" button will only mark absent students from these groups.
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1, borderRadius: 10, padding: 12, fontSize: 14 }}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} style={{ flex: 1, borderRadius: 10, padding: 12, fontSize: 14, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
