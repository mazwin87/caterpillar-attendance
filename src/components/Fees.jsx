import { useState } from 'react'
import { createPayment, supabase } from '../lib/supabase'
import { MONTHS } from '../lib/constants'
import { renderReceiptDocument } from '../lib/receiptTemplate'
import { useBranches } from '../hooks/useBranches'
import { useStudents } from '../hooks/useStudents'
import { usePayments } from '../hooks/usePayments'
import FeeSummaryBar from './fees/FeeSummaryBar'
import FeeBatchToolbar from './fees/FeeBatchToolbar'
import FeeStudentList from './fees/FeeStudentList'
import RecordPaymentModal from './fees/RecordPaymentModal'

const inputClass = "w-full bg-page border border-border rounded-[10px] px-3.5 py-2.5 text-sm text-ink outline-none"

export default function Fees({ session }) {
  const { branches } = useBranches()
  const { students, loading: studentsLoading } = useStudents()
  const { payments, setPayments, loading: paymentsLoading } = usePayments()
  const loading = studentsLoading || paymentsLoading

  const [filterBranch, setFilterBranch] = useState('')
  const [filterMonth, setFilterMonth]   = useState(MONTHS[new Date().getMonth()])
  const [filterYear, setFilterYear]     = useState(new Date().getFullYear())
  const [filterStatus, setFilterStatus] = useState('') // 'paid' | 'unpaid' | ''
  const [selected, setSelected]         = useState([])
  const [payMethod, setPayMethod]       = useState('Cash')
  const [processing, setProcessing]     = useState(false)
  const [recordModal, setRecordModal]   = useState(null)
  const [singleAmount, setSingleAmount] = useState('')
  const [singleMethod, setSingleMethod] = useState('Cash')
  const [singleDate, setSingleDate]     = useState(new Date().toISOString().split('T')[0])
  const [sending, setSending]           = useState(null)
  const [sendTG, setSendTG]             = useState(false)
  const [batchSendTG, setBatchSendTG]   = useState(false)

  function getPayment(studentId) {
    return payments.find(p =>
      p.student_id === studentId &&
      p.month === filterMonth &&
      p.year === filterYear
    )
  }

  const branchFiltered = students.filter(s => !filterBranch || s.branch_id === filterBranch)
  const paidStudents    = branchFiltered.filter(s =>  !!getPayment(s.id))
  const unpaidStudents  = branchFiltered.filter(s => !getPayment(s.id))
  const summaryTotal    = paidStudents.reduce((a, s) => a + parseFloat(getPayment(s.id)?.amount || 0), 0)

  const filteredStudents =
    filterStatus === 'paid'   ? paidStudents :
    filterStatus === 'unpaid' ? unpaidStudents :
    branchFiltered

  const displayUnpaid = filteredStudents.filter(s => !getPayment(s.id))
  const displayPaid   = filteredStudents.filter(s =>  !!getPayment(s.id))

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function selectAllUnpaid() {
    const allUnpaidIds = displayUnpaid.map(s => s.id)
    const allSelected  = allUnpaidIds.every(id => selected.includes(id))
    setSelected(allSelected ? [] : allUnpaidIds)
  }

  function openRecordModal(student) {
    setRecordModal(student)
    setSingleAmount(student.monthly_fee || '')
    setSingleMethod('Cash')
    setSingleDate(new Date().toISOString().split('T')[0])
    setSendTG(false)
  }

  async function recordSingle() {
    const student = recordModal
    setProcessing(true)
    try {
      const payment = await createPayment({
        student_id:     student.id,
        branch_id:      student.branch_id,
        amount:         parseFloat(singleAmount) || student.monthly_fee,
        month:          filterMonth,
        year:           filterYear,
        paid_date:      singleDate,
        payment_method: singleMethod,
        issued_by:      session?.teacherName || 'Admin',
      })
      setPayments(prev => [...prev, payment])
      setRecordModal(null)
      if (sendTG) await sendTelegram(payment)
      setSendTG(false)
    } catch (err) { alert(err.message) }
    finally { setProcessing(false) }
  }

  async function recordBatch() {
    if (selected.length === 0) return
    if (!window.confirm(`Record payment for ${selected.length} students?`)) return
    setProcessing(true)
    const newPayments = []

    for (const studentId of selected) {
      const student = students.find(s => s.id === studentId)
      if (!student) continue
      try {
        const payment = await createPayment({
          student_id:     student.id,
          branch_id:      student.branch_id,
          amount:         student.monthly_fee || 0,
          month:          filterMonth,
          year:           filterYear,
          paid_date:      new Date().toISOString().split('T')[0],
          payment_method: payMethod,
          issued_by:      session?.teacherName || 'Admin',
        })
        newPayments.push(payment)
      } catch (err) {
        console.error(`Failed for ${student.name}:`, err.message)
      }
    }

    setPayments(prev => [...prev, ...newPayments])
    setSelected([])

    if (batchSendTG && newPayments.length > 0) {
      let sent = 0
      let failed = 0
      for (const payment of newPayments) {
        try {
          const { data, error } = await supabase.functions.invoke('send_payment_notification', {
            body: { payment_ids: [payment.id] },
          })
          if (!error && data?.ok) sent++
          else failed++
        } catch { failed++ }
      }
      alert(`✅ ${newPayments.length} payments recorded!\n📱 ${sent} receipts sent via Telegram${failed > 0 ? `\n⚠️ ${failed} failed (no Telegram linked)` : ''}`)
    } else {
      alert(`✅ ${newPayments.length} payments recorded!`)
    }

    setBatchSendTG(false)
    setProcessing(false)
  }

  function printReceipt(payment) {
    const win = window.open('', '_blank')
    win.document.write(renderReceiptDocument([payment], window.location.origin))
    win.document.close()
    win.onload = () => win.print()
  }

  function openReceiptPage(payment) {
    window.open(`/receipt/${payment.id}`, '_blank')
  }

  async function sendTelegram(payment) {
    setSending(payment.id)
    try {
      const { data, error } = await supabase.functions.invoke('send_payment_notification', {
        body: { payment_ids: [payment.id] },
      })
      if (error) { alert('Failed: ' + error.message); return }
      if (!data.ok) alert(data.error === 'no_telegram' ? 'Parent has no Telegram linked.' : 'Telegram error: ' + (data.description || data.error))
      else alert('Receipt sent via Telegram! ✅')
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="min-h-full bg-page" style={{ paddingBottom: 'var(--navbar-height)' }}>

      {/* Header */}
      <div className="pt-[52px] lg:pt-8 bg-surface border-b border-border pb-4 px-5">
       <div className="lg:max-w-5xl lg:mx-auto">
        <div className="text-[22px] font-medium text-ink mb-3.5">Fees</div>
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <select value={filterBranch} onChange={e => { setFilterBranch(e.target.value); setSelected([]); setFilterStatus('') }} className={`lg:max-w-xs ${inputClass}`}>
            <option value="">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div className="grid grid-cols-2 lg:flex gap-2">
            <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setSelected([]); setFilterStatus('') }} className={`lg:max-w-[160px] ${inputClass}`}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => { setFilterYear(parseInt(e.target.value)); setSelected([]); setFilterStatus('') }} className={`lg:max-w-[110px] ${inputClass}`}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
       </div>
      </div>

      {branchFiltered.length > 0 && (
        <FeeSummaryBar
          paidCount={paidStudents.length}
          unpaidCount={unpaidStudents.length}
          total={summaryTotal}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />
      )}

      {selected.length > 0 && (
        <FeeBatchToolbar
          count={selected.length}
          payMethod={payMethod}
          onMethodChange={setPayMethod}
          onRecord={recordBatch}
          onClear={() => setSelected([])}
          processing={processing}
          sendTG={batchSendTG}
          onToggleSendTG={setBatchSendTG}
        />
      )}

      <div className="lg:max-w-5xl lg:mx-auto p-4 flex flex-col gap-3">
        <FeeStudentList
          loading={loading}
          filterBranch={filterBranch}
          displayUnpaid={displayUnpaid}
          displayPaid={displayPaid}
          selected={selected}
          onToggleSelect={toggleSelect}
          onSelectAllUnpaid={selectAllUnpaid}
          getPayment={getPayment}
          onRecordClick={openRecordModal}
          onPrint={printReceipt}
          onOpenReceipt={openReceiptPage}
          onSendTelegram={sendTelegram}
          sendingId={sending}
        />
      </div>

      <RecordPaymentModal
        student={recordModal}
        month={filterMonth}
        year={filterYear}
        amount={singleAmount}
        onAmountChange={setSingleAmount}
        method={singleMethod}
        onMethodChange={setSingleMethod}
        date={singleDate}
        onDateChange={setSingleDate}
        sendTG={sendTG}
        onToggleSendTG={setSendTG}
        onSave={recordSingle}
        onClose={() => setRecordModal(null)}
        processing={processing}
      />
    </div>
  )
}
