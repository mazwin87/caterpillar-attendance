import { MONTHS, PAYMENT_METHODS } from '../../lib/constants'

const inputClass = "w-full bg-page border border-border rounded-[10px] px-3.5 py-2.5 text-sm text-ink outline-none"

export default function ReceiptForm({ form, setForm, branches, students, selectedStudent, onToggleMonth, onSelectAllMonths, onGenerate, generating }) {
  return (
    <>
      {/* Branch & Student */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2.5">
        <div className="text-[13px] font-medium text-ink mb-0.5">Student</div>
        <select value={form.branch_id}
          onChange={e => setForm(f => ({ ...f, branch_id: e.target.value, student_id: '' }))} className={inputClass}>
          <option value="">Select branch</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={form.student_id}
          onChange={e => {
            const s = students.find(s => s.id === e.target.value)
            setForm(f => ({ ...f, student_id: e.target.value, amount: s?.monthly_fee || '' }))
          }} className={inputClass}>
          <option value="">Select student</option>
          {students
            .filter(s => !form.branch_id || s.branch_id === form.branch_id)
            .map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_no})</option>)
          }
        </select>
        {selectedStudent && (
          <div className="bg-present-bg border border-present rounded-lg px-3 py-2 text-xs text-present">
            Monthly fee: RM {parseFloat(selectedStudent.monthly_fee || 0).toFixed(2)}
          </div>
        )}
      </div>

      {/* Month selector */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-[13px] font-medium text-ink">
            Select months
            {form.months.length > 0 && <span className="ml-2 text-[11px] bg-present-bg text-present px-2 py-0.5 rounded-full">{form.months.length} selected</span>}
          </div>
          <button onClick={onSelectAllMonths}
            className="text-[11px] text-present bg-transparent border-0 cursor-pointer font-medium">
            {form.months.length === 12 ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        <select value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
          className={`${inputClass} mb-3`}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <div className="grid grid-cols-4 gap-1.5">
          {MONTHS.map(m => {
            const selected = form.months.includes(m)
            return (
              <button key={m} type="button" onClick={() => onToggleMonth(m)}
                className={`py-2 px-1 rounded-lg text-xs cursor-pointer text-center transition-all duration-150 border ${
                  selected ? 'bg-present text-white border-present font-medium' : 'bg-page text-muted border-border font-normal'
                }`}>
                {m.substring(0, 3)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Amount & Payment */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2.5">
        <div className="text-[13px] font-medium text-ink mb-0.5">Payment details</div>

        <div>
          <div className="text-[11px] text-muted mb-1">Amount per month (RM)</div>
          <input type="number" step="0.01" value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            placeholder="0.00" className={inputClass} />
          {form.months.length > 1 && form.amount && (
            <div className="text-[11px] text-muted mt-1">
              Total: RM {(parseFloat(form.amount) * form.months.length).toFixed(2)} for {form.months.length} months
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] text-muted mb-1.5">Payment method</div>
          <div className="flex gap-2">
            {PAYMENT_METHODS.map(m => (
              <button key={m} type="button" onClick={() => setForm(f => ({ ...f, payment_method: m }))}
                className={`flex-1 py-2 rounded-lg text-xs cursor-pointer border ${
                  form.payment_method === m ? 'bg-present text-white border-present font-medium' : 'bg-page text-muted border-border font-normal'
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-muted mb-1">Payment date</div>
          <input type="date" value={form.paid_date}
            onChange={e => setForm(f => ({ ...f, paid_date: e.target.value }))} className={inputClass} />
        </div>
      </div>

      {/* Summary before generating */}
      {form.student_id && form.months.length > 0 && form.amount && (
        <div className="bg-present-bg border border-present rounded-xl px-4 py-3.5">
          <div className="text-[13px] font-medium text-present mb-1.5">
            Ready to generate {form.months.length} receipt{form.months.length > 1 ? 's' : ''}
          </div>
          <div className="text-xs text-ink leading-loose">
            <div>👦 {selectedStudent?.name}</div>
            <div>📅 {[...form.months].sort((a,b) => MONTHS.indexOf(a) - MONTHS.indexOf(b)).join(', ')} {form.year}</div>
            <div>💰 RM {parseFloat(form.amount).toFixed(2)} × {form.months.length} = RM {(parseFloat(form.amount) * form.months.length).toFixed(2)}</div>
            <div>💳 {form.payment_method}</div>
          </div>
        </div>
      )}

      <button onClick={onGenerate}
        disabled={generating || !form.student_id || form.months.length === 0 || !form.amount}
        className="bg-present text-white border-0 rounded-[10px] py-3.5 text-sm font-medium cursor-pointer disabled:opacity-50">
        {generating ? `Generating ${form.months.length} receipts...` : `Generate & Print ${form.months.length > 0 ? form.months.length : ''} Receipt${form.months.length > 1 ? 's' : ''}`}
      </button>
    </>
  )
}
