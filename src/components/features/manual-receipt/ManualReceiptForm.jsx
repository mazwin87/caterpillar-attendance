import { Select, Input, Button } from '../../ui'
import MonthSelector from './MonthSelector'
import { MONTHS, PAYMENT_METHODS } from '../../../lib/constants/months'

export default function ManualReceiptForm({
  students, branches,
  form, selectedStudent,
  selectBranch, selectStudent, setField,
  toggleMonth, selectAllMonths,
  generating,
  onGenerate,
}) {
  const sortedMonths = [...form.months].sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b))
  const canGenerate  = !!form.student_id && form.months.length > 0 && !!form.amount

  return (
    <>
      {/* Branch & Student */}
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>Student</div>
        <Select value={form.branch_id} onChange={e => selectBranch(e.target.value)}>
          <option value="">Select branch</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
        <Select value={form.student_id} onChange={e => selectStudent(e.target.value)}>
          <option value="">Select student</option>
          {students
            .filter(s => !form.branch_id || s.branch_id === form.branch_id)
            .map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_no})</option>)
          }
        </Select>
        {selectedStudent && (
          <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--present)' }}>
            Monthly fee: RM {parseFloat(selectedStudent.monthly_fee || 0).toFixed(2)}
          </div>
        )}
      </div>

      {/* Month selector */}
      <MonthSelector
        selectedMonths={form.months}
        year={form.year}
        onToggleMonth={toggleMonth}
        onSelectAll={selectAllMonths}
        onYearChange={v => setField('year', v)}
      />

      {/* Payment details */}
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>Payment details</div>

        <div>
          <Input
            label="Amount per month (RM)"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={e => setField('amount', e.target.value)}
            placeholder="0.00"
          />
          {form.months.length > 1 && form.amount && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              Total: RM {(parseFloat(form.amount) * form.months.length).toFixed(2)} for {form.months.length} months
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Payment method</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {PAYMENT_METHODS.map(m => (
              <button
                key={m} type="button"
                onClick={() => setField('payment_method', m)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  background:  form.payment_method === m ? 'var(--present)' : 'var(--bg)',
                  color:       form.payment_method === m ? '#fff' : 'var(--muted)',
                  border:      `0.5px solid ${form.payment_method === m ? 'var(--present)' : 'var(--border)'}`,
                  fontWeight:  form.payment_method === m ? 500 : 400,
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Payment date"
          type="date"
          value={form.paid_date}
          onChange={e => setField('paid_date', e.target.value)}
        />
      </div>

      {/* Pre-generate summary */}
      {canGenerate && (
        <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--present)', marginBottom: 6 }}>
            Ready to generate {form.months.length} receipt{form.months.length > 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.8 }}>
            <div>👦 {selectedStudent?.name}</div>
            <div>📅 {sortedMonths.join(', ')} {form.year}</div>
            <div>💰 RM {parseFloat(form.amount).toFixed(2)} × {form.months.length} = RM {(parseFloat(form.amount) * form.months.length).toFixed(2)}</div>
            <div>💳 {form.payment_method}</div>
          </div>
        </div>
      )}

      <Button
        onClick={onGenerate}
        disabled={generating || !canGenerate}
        style={{ padding: '14px', fontSize: 14, width: '100%' }}
      >
        {generating
          ? `Generating ${form.months.length} receipts...`
          : `Generate & Print ${form.months.length > 0 ? form.months.length : ''} Receipt${form.months.length !== 1 ? 's' : ''}`
        }
      </Button>
    </>
  )
}
