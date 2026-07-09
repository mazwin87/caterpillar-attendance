import Modal from '../ui/Modal'
import { PAYMENT_METHODS } from '../../lib/constants'

const inputClass = "w-full bg-page border border-border rounded-[10px] px-3.5 py-2.5 text-sm text-ink outline-none"

export default function RecordPaymentModal({
  student, month, year, amount, onAmountChange, method, onMethodChange,
  date, onDateChange, sendTG, onToggleSendTG, onSave, onClose, processing,
}) {
  if (!student) return null

  return (
    <Modal open={!!student} onClose={onClose} title="Record Payment" subtitle={`${student.name} · ${month} ${year}`}>
      <div className="flex flex-col gap-2.5">
        <div>
          <div className="text-[11px] text-muted mb-1">Amount (RM)</div>
          <input type="number" step="0.01" value={amount} onChange={e => onAmountChange(e.target.value)} className={inputClass} />
        </div>
        <div>
          <div className="text-[11px] text-muted mb-1.5">Payment method</div>
          <div className="flex gap-2">
            {PAYMENT_METHODS.map(m => (
              <button key={m} type="button" onClick={() => onMethodChange(m)}
                className={`flex-1 py-2 rounded-lg text-xs cursor-pointer border ${
                  method === m ? 'bg-present text-white border-present font-medium' : 'bg-page text-muted border-border font-normal'
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-muted mb-1">Payment date</div>
          <input type="date" value={date} onChange={e => onDateChange(e.target.value)} className={inputClass} />
        </div>
        <div onClick={() => onToggleSendTG(!sendTG)}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 bg-page rounded-[10px] border cursor-pointer ${
            sendTG ? 'border-present' : 'border-border'
          }`}>
          <div className={`w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 ${
            sendTG ? 'border-present bg-present' : 'border-border bg-transparent'
          }`}>
            {sendTG && <span className="text-white text-[11px] font-bold">✓</span>}
          </div>
          <div>
            <div className="text-[13px] text-ink font-medium">Send receipt via Telegram</div>
            <div className="text-[11px] text-muted mt-0.5">Parent will receive receipt link instantly</div>
          </div>
        </div>
        <div className="flex gap-2.5 mt-1">
          <button onClick={onClose}
            className="flex-1 bg-page border border-border rounded-[10px] py-3 text-sm text-muted cursor-pointer">
            Cancel
          </button>
          <button onClick={onSave} disabled={processing}
            className="flex-1 bg-present border-0 rounded-[10px] py-3 text-sm text-white font-medium cursor-pointer disabled:opacity-60">
            {processing ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
