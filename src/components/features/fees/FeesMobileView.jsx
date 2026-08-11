import { useState } from 'react'
import FeeStatusGrid from './FeeStatusGrid'
import PaymentForm from './PaymentForm'
import { Select, Spinner, Button, Checkbox, EmptyState } from '../../ui'
import { MONTHS, PAYMENT_METHODS } from '../../../lib/constants/months'
import { shortBranchName } from '../../../lib/constants/branches'
import { generateReceiptHTML } from '../../../lib/utils/receipt'
import { openPrintWindow } from '../../../lib/utils/print'

export default function FeesMobileView({
  // raw data
  students, branches, loading,
  // filters
  filterBranch, setFilterBranch,
  filterMonth,  setFilterMonth,
  filterYear,   setFilterYear,
  filterStatus, setFilterStatus,
  // selection
  selected, toggleSelect, selectAllUnpaid, clearSelection,
  payMethod, setPayMethod,
  batchSendTG, setBatchSendTG,
  // derived lists
  paidStudents, unpaidStudents, summaryTotal,
  displayPaid, displayUnpaid,
  // operation state
  processing, sending,
  // actions
  getPayment,
  createSinglePayment,
  recordBatch,
  sendSingleTelegram,
}) {
  const [recordModal, setRecordModal] = useState(null)

  function printReceipt(payment) {
    openPrintWindow(generateReceiptHTML(payment, window.location.origin))
  }

  function openReceiptPage(payment) {
    window.open(`/receipt/${payment.id}`, '_blank')
  }

  async function handleRecordSingle(formData) {
    try {
      const payment = await createSinglePayment(recordModal, formData)
      setRecordModal(null)
      if (formData.sendTG) await sendSingleTelegram(payment)
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
          <Select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
            <option value="">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
        </div>
      </div>

      <FeeStatusGrid
        paidCount={paidStudents.length}
        unpaidCount={unpaidStudents.length}
        total={summaryTotal}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />

      {/* Batch toolbar */}
      {selected.length > 0 && (
        <div style={{ margin: '12px 16px 0', background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--present)', flex: 1 }}>
              {selected.length} selected
            </div>
            <Select
              value={payMethod}
              onChange={e => setPayMethod(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 12, borderRadius: 8 }}
            >
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Button
              onClick={recordBatch}
              disabled={processing}
              style={{ borderRadius: 8, padding: '8px 16px', fontSize: 12 }}
            >
              {processing ? 'Processing...' : `Record ${selected.length} payments`}
            </Button>
            <Button variant="ghost" onClick={clearSelection} style={{ fontSize: 18, padding: 4 }}>×</Button>
          </div>
          <Checkbox
            checked={batchSendTG}
            onChange={() => setBatchSendTG(v => !v)}
            label="Send receipt via Telegram to all selected parents"
          />
        </div>
      )}

      {/* Student list */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spinner />
          </div>
        ) : displayUnpaid.length === 0 && displayPaid.length === 0 ? (
          <EmptyState>
            {filterBranch ? 'No students found' : 'Select a branch to view students'}
          </EmptyState>
        ) : (
          <>
            {/* Unpaid section */}
            {displayUnpaid.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Unpaid — {displayUnpaid.length}
                  </div>
                  <Button variant="ghost" onClick={selectAllUnpaid} style={{ fontSize: 11, color: 'var(--present)', padding: 0, fontWeight: 500 }}>
                    {displayUnpaid.every(s => selected.includes(s.id)) ? 'Deselect all' : 'Select all'}
                  </Button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {displayUnpaid.map(s => (
                    <div
                      key={s.id}
                      style={{
                        border: `0.5px solid ${selected.includes(s.id) ? 'var(--present)' : 'var(--border)'}`,
                        borderRadius: 12, padding: '12px 14px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: selected.includes(s.id) ? 'var(--present-bg)' : 'var(--surface)',
                      }}
                    >
                      <div
                        onClick={() => toggleSelect(s.id)}
                        style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${selected.includes(s.id) ? 'var(--present)' : 'var(--border)'}`, background: selected.includes(s.id) ? 'var(--present)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      >
                        {selected.includes(s.id) && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
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
            {displayPaid.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Paid — {displayPaid.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {displayPaid.map(s => {
                    const p = getPayment(s.id)
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
                          <button onClick={() => printReceipt(p)} style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '5px 8px', fontSize: 11, color: 'var(--text)', cursor: 'pointer' }}>🖨️</button>
                          <button onClick={() => openReceiptPage(p)} style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '5px 8px', fontSize: 11, color: 'var(--text)', cursor: 'pointer' }}>🔗</button>
                          <button
                            onClick={() => sendSingleTelegram(p)}
                            disabled={sending === p?.id}
                            style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 8, padding: '5px 8px', fontSize: 11, color: 'var(--holiday)', cursor: 'pointer', opacity: sending === p?.id ? 0.6 : 1 }}
                          >
                            {sending === p?.id ? '...' : '📱'}
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
          filterMonth={filterMonth}
          filterYear={filterYear}
          onSave={handleRecordSingle}
          onClose={() => setRecordModal(null)}
          isProcessing={processing}
        />
      )}
    </div>
  )
}
