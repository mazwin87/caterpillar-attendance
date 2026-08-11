import { useState } from 'react'
import { Modal, Input, Button, Checkbox } from '../../ui'
import { PAYMENT_METHODS } from '../../../lib/constants/months'

export default function PaymentForm({ student, filterMonth, filterYear, onSave, onClose, isProcessing, variant = 'bottom' }) {
  const [amount, setAmount] = useState(String(student.monthly_fee || ''))
  const [method, setMethod] = useState('Cash')
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [sendTG, setSendTG] = useState(false)

  return (
    <Modal onClose={onClose} variant={variant}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Record Payment</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {student.name} · {filterMonth} {filterYear}
          </div>
        </div>
        <Button variant="ghost" onClick={onClose} style={{ fontSize: 22, padding: 4 }}>×</Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Input
          label="Amount (RM)"
          type="number"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Payment method</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {PAYMENT_METHODS.map(m => (
              <button
                key={m} type="button"
                onClick={() => setMethod(m)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  background:  method === m ? 'var(--present)' : 'var(--bg)',
                  color:       method === m ? '#fff' : 'var(--muted)',
                  border:      `0.5px solid ${method === m ? 'var(--present)' : 'var(--border)'}`,
                  fontWeight:  method === m ? 500 : 400,
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
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        <Checkbox
          checked={sendTG}
          onChange={() => setSendTG(v => !v)}
          label="Send receipt via Telegram"
          sublabel="Parent will receive receipt link instantly"
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={() => onSave({ amount, method, date, sendTG })} disabled={isProcessing} style={{ flex: 1 }}>
            {isProcessing ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
