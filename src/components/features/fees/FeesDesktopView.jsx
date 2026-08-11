import { useState } from 'react'
import PaymentForm from './PaymentForm'
import { PageHeader, DataFilter, Table, Select, Button, Checkbox, Spinner } from '../../ui'
import { MONTHS, PAYMENT_METHODS } from '../../../lib/constants/months'
import { generateReceiptHTML } from '../../../lib/utils/receipt'
import { openPrintWindow } from '../../../lib/utils/print'

const YEARS = [2024, 2025, 2026, 2027]

function FilterPill({ active, onClick, children, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 8,
        fontSize: 12, cursor: 'pointer',
        background:  active ? (color || 'var(--present)') : 'var(--bg)',
        color:       active ? '#fff' : 'var(--muted)',
        border:      `0.5px solid ${active ? (color || 'var(--present)') : 'var(--border)'}`,
        fontWeight:  active ? 500 : 400,
        marginBottom: 3,
      }}
    >
      {children}
    </button>
  )
}

export default function FeesDesktopView({
  // raw data
  branches, loading,
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

  // Merge unpaid + paid into one table list (unpaid first)
  const tableRows = [
    ...displayUnpaid.map(s => ({
      id:         s.id,
      name:       s.name,
      branch:     s.branches?.name || '—',
      status:     'unpaid',
      amount:     parseFloat(s.monthly_fee || 0),
      receipt_no: '—',
      _student:   s,
      _payment:   null,
    })),
    ...displayPaid.map(s => {
      const p = getPayment(s.id)
      return {
        id:         s.id,
        name:       s.name,
        branch:     s.branches?.name || '—',
        status:     'paid',
        amount:     parseFloat(p?.amount || 0),
        receipt_no: p?.receipt_no || '—',
        _student:   s,
        _payment:   p,
      }
    }),
  ]

  const rowBtn = { padding: '4px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }
  const rowBtnTG = { ...rowBtn, border: '0.5px solid var(--holiday)', background: 'var(--holiday-bg)', color: 'var(--holiday)' }

  const allUnpaidSelected = displayUnpaid.length > 0 && displayUnpaid.every(s => selected.includes(s.id))

  const columns = [
    {
      key: '_check', label: '', sortable: false,
      render: (row) => row.status === 'unpaid'
        ? (
          <div
            onClick={() => toggleSelect(row.id)}
            style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${selected.includes(row.id) ? 'var(--present)' : 'var(--border)'}`, background: selected.includes(row.id) ? 'var(--present)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            {selected.includes(row.id) && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
          </div>
        )
        : (
          <div style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--present)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>
          </div>
        ),
    },
    {
      key: 'name', label: 'Student', sortable: true,
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: row.status === 'paid' ? 'var(--present-bg)' : 'var(--absent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: row.status === 'paid' ? 'var(--present)' : 'var(--absent)', flexShrink: 0 }}>
            {row.name.charAt(0)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{row.name}</span>
        </span>
      ),
    },
    { key: 'branch', label: 'Branch', sortable: true },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (row) => row.status === 'paid'
        ? <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'var(--present-bg)', color: 'var(--present)', fontWeight: 500 }}>Paid</span>
        : <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'var(--absent-bg)', color: 'var(--absent)', fontWeight: 500 }}>Unpaid</span>,
    },
    {
      key: 'amount', label: 'Amount', sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 500, color: row.status === 'paid' ? 'var(--present)' : 'var(--absent)' }}>
          RM {row.amount.toFixed(2)}
        </span>
      ),
    },
    { key: 'receipt_no', label: 'Receipt No', sortable: true },
    {
      key: 'actions', label: '', sortable: false,
      render: (row) => row.status === 'unpaid'
        ? (
          <button
            onClick={() => setRecordModal(row._student)}
            style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}
          >
            Record
          </button>
        )
        : (
          <span style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => printReceipt(row._payment)} style={rowBtn}>🖨️ Print</button>
            <button onClick={() => openReceiptPage(row._payment)} style={rowBtn}>🔗 Link</button>
            <button
              onClick={() => sendSingleTelegram(row._payment)}
              disabled={sending === row._payment?.id}
              style={{ ...rowBtnTG, opacity: sending === row._payment?.id ? 0.6 : 1 }}
            >
              {sending === row._payment?.id ? '...' : '📱 TG'}
            </button>
          </span>
        ),
    },
  ]

  const isEmpty = displayUnpaid.length === 0 && displayPaid.length === 0

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Fees"
        subtitle={`${filterMonth} ${filterYear}`}
      />

      <div style={{ flex: 1, display: 'flex' }}>

        {/* Left filter panel */}
        <DataFilter>
          <DataFilter.Section label="Branch">
            <FilterPill active={filterBranch === ''} onClick={() => setFilterBranch('')}>All branches</FilterPill>
            {branches.map(b => (
              <FilterPill key={b.id} active={filterBranch === b.id} onClick={() => setFilterBranch(b.id)}>
                {b.name}
              </FilterPill>
            ))}
          </DataFilter.Section>

          <DataFilter.Section label="Month">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              {MONTHS.map(m => (
                <button key={m} onClick={() => setFilterMonth(m)}
                  style={{
                    padding: '5px 4px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    background:  filterMonth === m ? 'var(--present)' : 'var(--bg)',
                    color:       filterMonth === m ? '#fff' : 'var(--muted)',
                    border:      `0.5px solid ${filterMonth === m ? 'var(--present)' : 'var(--border)'}`,
                    fontWeight:  filterMonth === m ? 500 : 400,
                    textAlign: 'center',
                  }}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          </DataFilter.Section>

          <DataFilter.Section label="Year">
            {YEARS.map(y => (
              <FilterPill key={y} active={filterYear === y} onClick={() => setFilterYear(y)}>
                {y}
              </FilterPill>
            ))}
          </DataFilter.Section>

          <DataFilter.Section label="Status">
            <FilterPill active={filterStatus === ''} onClick={() => setFilterStatus('')}>All</FilterPill>
            <FilterPill active={filterStatus === 'paid'} onClick={() => setFilterStatus('paid')} color="var(--present)">✓ Paid</FilterPill>
            <FilterPill active={filterStatus === 'unpaid'} onClick={() => setFilterStatus('unpaid')} color="var(--absent)">✗ Unpaid</FilterPill>
          </DataFilter.Section>
        </DataFilter>

        {/* Main content */}
        <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--present)', lineHeight: 1 }}>{paidStudents.length}</div>
              <div style={{ fontSize: 11, color: 'var(--present)', marginTop: 4, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</div>
            </div>
            <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--absent)', lineHeight: 1 }}>{unpaidStudents.length}</div>
              <div style={{ fontSize: 11, color: 'var(--absent)', marginTop: 4, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unpaid</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>RM {summaryTotal.toFixed(0)}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collected</div>
            </div>
          </div>

          {/* Batch toolbar */}
          {selected.length > 0 && (
            <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--present)', flex: 1 }}>
                  {selected.length} selected
                </span>
                <Button variant="ghost" onClick={selectAllUnpaid} style={{ fontSize: 12, color: 'var(--present)', padding: '4px 8px', fontWeight: 500 }}>
                  {allUnpaidSelected ? 'Deselect all' : 'Select all unpaid'}
                </Button>
                <Select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: 12, borderRadius: 8 }}
                >
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
                <Button onClick={recordBatch} disabled={processing} style={{ fontSize: 12, padding: '8px 16px' }}>
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

          {/* Select all unpaid link (when no batch toolbar visible) */}
          {selected.length === 0 && displayUnpaid.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={selectAllUnpaid} style={{ fontSize: 12, color: 'var(--present)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Select all unpaid ({displayUnpaid.length}) →
              </button>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
              <Spinner />
            </div>
          ) : isEmpty ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontSize: 13 }}>
              {filterBranch ? 'No students found' : 'Select a branch in the filter panel'}
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <Table columns={columns} rows={tableRows} emptyMessage="No students found." />
            </div>
          )}

        </div>
      </div>

      {recordModal && (
        <PaymentForm
          student={recordModal}
          filterMonth={filterMonth}
          filterYear={filterYear}
          onSave={handleRecordSingle}
          onClose={() => setRecordModal(null)}
          isProcessing={processing}
          variant="center"
        />
      )}
    </div>
  )
}
