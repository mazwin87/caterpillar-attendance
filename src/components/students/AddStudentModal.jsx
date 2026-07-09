import Modal from '../ui/Modal'
import { AGE_OPTIONS } from '../../lib/constants'

const inputClass = "w-full bg-page border border-border rounded-[10px] px-3.5 py-2.5 text-sm text-ink outline-none"
const errorClass = "text-[11px] text-absent -mt-1.5"

const divider = (label) => (
  <div className="flex items-center gap-2.5 my-1.5">
    <div className="flex-1 h-px bg-border" />
    <div className="text-[10px] text-muted tracking-wider uppercase">{label}</div>
    <div className="flex-1 h-px bg-border" />
  </div>
)

export default function AddStudentModal({ open, onClose, form, setForm, errors, setErrors, branches, onGenerateStudentNo, onSubmit, saving }) {
  return (
    <Modal open={open} onClose={onClose} title="Add student">
      <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
        {divider('Student info')}
        <input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(f => ({ ...f, name: '' })) }} placeholder="Full name" className={inputClass} />
        {errors.name && <div className={errorClass}>⚠️ Student name is required</div>}

        <select value={form.branch_id}
          onChange={async e => {
            const branchId = e.target.value
            const studentNo = await onGenerateStudentNo(branchId)
            setForm(f => ({ ...f, branch_id: branchId, student_no: studentNo, age_group: '' }))
            setErrors(f => ({ ...f, branch_id: '' }))
          }} className={inputClass}>
          <option value="">Select branch</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {errors.branch_id && <div className={errorClass}>⚠️ Please select a branch</div>}

        <div className="relative">
          <input value={form.student_no} readOnly placeholder="Student ID — select branch first"
            className={`${inputClass} text-muted bg-border pr-[70px]`} />
          {form.student_no && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-present bg-present-bg px-2 py-0.5 rounded-full">Auto</span>
          )}
        </div>

        <select value={form.age_group} onChange={e => { setForm(f => ({ ...f, age_group: e.target.value })); setErrors(f => ({ ...f, age_group: '' })) }} className={inputClass}>
          <option value="">Select age group</option>
          {AGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {errors.age_group && <div className={errorClass}>⚠️ Please select an age group</div>}

        <div>
          <div className="text-[11px] text-muted mb-1">Date of birth</div>
          <input type="date" value={form.date_of_birth} max={new Date().toISOString().split('T')[0]}
            onChange={e => { setForm(f => ({ ...f, date_of_birth: e.target.value })); setErrors(f => ({ ...f, date_of_birth: '' })) }} className={inputClass} />
          {errors.date_of_birth && <div className="text-[11px] text-absent mt-1">⚠️ Please enter date of birth</div>}
        </div>

        <div>
          <div className="text-[11px] text-muted mb-1">Monthly fee (RM)</div>
          <input type="number" step="0.01" value={form.monthly_fee || ''}
            onChange={e => { setForm(f => ({ ...f, monthly_fee: e.target.value })); setErrors(f => ({ ...f, monthly_fee: '' })) }}
            placeholder="0.00" className={inputClass} />
          {errors.monthly_fee && <div className="text-[11px] text-absent mt-1">⚠️ Please enter monthly fee</div>}
        </div>

        {divider('Parent info')}
        <input value={form.parent_name}
          onChange={e => { setForm(f => ({ ...f, parent_name: e.target.value })); setErrors(f => ({ ...f, parent_name: '' })) }}
          placeholder="Parent / guardian name" className={inputClass} />
        {errors.parent_name && <div className={errorClass}>⚠️ Parent name is required</div>}

        <input value={form.parent_phone} type="tel"
          onChange={e => { setForm(f => ({ ...f, parent_phone: e.target.value })); setErrors(f => ({ ...f, parent_phone: '' })) }}
          placeholder="Phone number e.g. 012-345 6789" className={inputClass} />
        {errors.parent_phone && <div className={errorClass}>⚠️ Phone number is required</div>}

        <input value={form.parent_email} type="email"
          onChange={e => { setForm(f => ({ ...f, parent_email: e.target.value })); setErrors(f => ({ ...f, parent_email: '' })) }}
          placeholder="Email (optional)" className={inputClass} />

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
