import { useState } from 'react'
import { useFees } from '../../../hooks/useFees'
import FeeStatusGrid from './FeeStatusGrid'
import PaymentForm from './PaymentForm'
import { Select, Spinner, Button, Checkbox, EmptyState } from '../../ui'
import { MONTHS, PAYMENT_METHODS } from '../../../lib/constants/months'
import { shortBranchName } from '../../../lib/constants/branches'
import { generateReceiptHTML } from '../../../lib/utils/receipt'
import { openPrintWindow } from '../../../lib/utils/print'

export default function FeesPage({ session }) {
  const fees = useFees(session)
  const [recordModal, setRecordModal] = useState(null)

  function printReceipt(payment) {
    openPrintWindow(generateReceiptHTML(payment, window.location.origin))
  }

  function openReceiptPage(payment) {
    window.open(`/receipt/${payment.id}`, '_blank')
  }

  async function handleRecordSingle(formData) {
    try {
      const payment = await fees.createSinglePayment(recordModal, formData)
      setRecordModal(null) // close before sending TG — matches original behaviour
      if (formData.sendTG) await fees.sendSingleTelegram(payment)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 'var(--navbar-height)' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>Fees</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Select value={fees.filterBranch} onChange={e => fees.setFilterBranch(e.target.value)}>
            <option value="">All branches</option>
            {fees.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Select value={fees.filterMonth} onChange={e => fees.setFilterMonth(e.target.value)}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Select value={fees.filterYear} onChange={e => fees.setFilterYear(e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
        </div>
      </div>

      <FeeStatusGrid
        paidCount={fees.paidStudents.length}
        unpaidCount={fees.unpaidStudents.length}
        total={fees.summaryTotal}
        filterStatus={fees.filterStatus}
        onFilterChange={fees.setFilterStatus}
      />

      {/* Batch toolbar */}
      {fees.selected.length > 0 && (
        <div style={{ margin: '12px 16px 0', background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--present)', flex: 1 }}>
              {fees.selected.length} selected
            </div>
            <Select
              value={fees.payMethod}
              onChange={e => fees.setPayMethod(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 12, borderRadius: 8 }}
            >
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Button
              onClick={fees.recordBatch}
              disabled={fees.processing}
              style={{ borderRadius: 8, padding: '8px 16px', fontSize: 12 }}
            >
              {fees.processing ? 'Processing...' : `Record ${fees.selected.length} payments`}
            </Button>
            <Button variant="ghost" onClick={fees.clearSelection} style={{ fontSize: 18, padding: 4 }}>×</Button>
          </div>

          <Checkbox
            checked={fees.batchSendTG}
            onChange={() => fees.setBatchSendTG(v => !v)}
            label="Send receipt via Telegram to all selected parents"
          />
        </div>
      )}

      {/* Student list */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fees.loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spinner />
          </div>
        ) : fees.displayUnpaid.length === 0 && fees.displayPaid.length === 0 ? (
          <EmptyState>
            {fees.filterBranch ? 'No students found' : 'Select a branch to view students'}
          </EmptyState>
        ) : (
          <>
            {/* Unpaid section */}
            {fees.displayUnpaid.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Unpaid — {fees.displayUnpaid.length}
                  </div>
                  <Button variant="ghost" onClick={fees.selectAllUnpaid} style={{ fontSize: 11, color: 'var(--present)', padding: 0, fontWeight: 500 }}>
                    {fees.displayUnpaid.every(s => fees.selected.includes(s.id)) ? 'Deselect all' : 'Select all'}
                  </Button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {fees.displayUnpaid.map(s => (
                    <div
                      key={s.id}
                      style={{
                        border: `0.5px solid ${fees.selected.includes(s.id) ? 'var(--present)' : 'var(--border)'}`,
                        borderRadius: 12, padding: '12px 14px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: fees.selected.includes(s.id) ? 'var(--present-bg)' : 'var(--surface)',
                      }}
                    >
                      <div
                        onClick={() => fees.toggleSelect(s.id)}
                        style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${fees.selected.includes(s.id) ? 'var(--present)' : 'var(--border)'}`, background: fees.selected.includes(s.id) ? 'var(--present)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      >
                        {fees.selected.includes(s.id) && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--absent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: 'var(--absent)', flexShrink: 0 }}>
                        {s.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                          {s.student_no} · {shortBranchName(s.branches?.name)}
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--absent)', flexShrink: 0 }}>
                        RM {parseFloat(s.monthly_fee || 0).toFixed(0)}
                      </div>
                      <button
                        onClick={() => setRecordModal(s)}
                        style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
                      >
                        Record
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paid section */}
            {fees.displayPaid.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Paid — {fees.displayPaid.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {fees.displayPaid.map(s => {
                    const p = fees.getPayment(s.id)
                    return (
                      <div key={s.id} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--present)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>
                        </div>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--present-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: 'var(--present)', flexShrink: 0 }}>
                          {s.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                            {p?.receipt_no} · {p?.payment_method}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--present)', flexShrink: 0 }}>
                          RM {parseFloat(p?.amount || 0).toFixed(0)}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => printReceipt(p)}
                            style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '5px 8px', fontSize: 11, color: 'var(--text)', cursor: 'pointer' }}
                          >
                            🖨️
                          </button>
                          <button
                            onClick={() => openReceiptPage(p)}
                            style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '5px 8px', fontSize: 11, color: 'var(--text)', cursor: 'pointer' }}
                          >
                            🔗
                          </button>
                          <button
                            onClick={() => fees.sendSingleTelegram(p)}
                            disabled={fees.sending === p?.id}
                            style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 8, padding: '5px 8px', fontSize: 11, color: 'var(--holiday)', cursor: 'pointer', opacity: fees.sending === p?.id ? 0.6 : 1 }}
                          >
                            {fees.sending === p?.id ? '...' : '📱'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {recordModal && (
        <PaymentForm
          student={recordModal}
          filterMonth={fees.filterMonth}
          filterYear={fees.filterYear}
          onSave={handleRecordSingle}
          onClose={() => setRecordModal(null)}
          isProcessing={fees.processing}
        />
      )}
    </div>
  )
}
