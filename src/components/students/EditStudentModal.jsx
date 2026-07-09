import Modal from '../ui/Modal'
import { AGE_OPTIONS } from '../../lib/constants'

const inputClass = "w-full bg-page border border-border rounded-[10px] px-3.5 py-2.5 text-sm text-ink outline-none"

export default function EditStudentModal({ open, onClose, editForm, setEditForm, onSubmit, saving }) {
  return (
    <Modal open={open} onClose={onClose} title="Edit student">
      <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
        <input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className={inputClass} />
        <select value={editForm.age_group} onChange={e => setEditForm(f => ({ ...f, age_group: e.target.value }))} className={inputClass}>
          <option value="">Select age group</option>
          {AGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div>
          <div className="text-[11px] text-muted mb-1">Date of birth</div>
          <input type="date" value={editForm.date_of_birth} max={new Date().toISOString().split('T')[0]}
            onChange={e => setEditForm(f => ({ ...f, date_of_birth: e.target.value }))} className={inputClass} />
        </div>
        <div className="bg-holiday-bg border border-holiday rounded-[10px] px-3.5 py-2.5 text-xs text-holiday">
          Student ID and branch cannot be changed after registration.
        </div>
        <div>
          <div className="text-[11px] text-muted mb-1">Monthly fee (RM)</div>
          <input type="number" step="0.01" value={editForm.monthly_fee || ''}
            onChange={e => setEditForm(f => ({ ...f, monthly_fee: e.target.value }))}
            placeholder="0.00" className={inputClass} />
        </div>
        <div className="flex gap-2.5 mt-1">
          <button type="button" onClick={onClose}
            className="flex-1 bg-page border border-border rounded-[10px] py-3 text-sm text-muted cursor-pointer">Cancel</button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-present border-0 rounded-[10px] py-3 text-sm text-white font-medium cursor-pointer disabled:opacity-60">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
