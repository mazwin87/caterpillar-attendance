import { useEffect, useState } from 'react'
import { getStudents, getBranches, getPayments, createPayment } from '../lib/supabase'
import { sendTelegramReceipt } from '../lib/services/fees.service'
import { MONTHS } from '../lib/constants/months'
import { getMYT } from '../lib/utils/date'

export function useFees(session) {
  const [students, setStudents]     = useState([])
  const [branches, setBranches]     = useState([])
  const [payments, setPayments]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filterBranch, _setFilterBranch] = useState('')
  const [filterMonth, _setFilterMonth]   = useState(MONTHS[new Date().getMonth()])
  const [filterYear, _setFilterYear]     = useState(new Date().getFullYear())
  const [filterStatus, setFilterStatus]  = useState('')
  const [selected, setSelected]     = useState([])
  const [payMethod, setPayMethod]   = useState('Cash')
  const [batchSendTG, setBatchSendTG] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [sending, setSending]       = useState(null)

  useEffect(() => {
    Promise.all([getStudents(), getBranches(), getPayments()])
      .then(([s, b, p]) => { setStudents(s); setBranches(b); setPayments(p) })
      .finally(() => setLoading(false))
  }, [])

  // Changing any filter resets selection and status filter — matches original behaviour
  function setFilterBranch(v) { _setFilterBranch(v); setSelected([]); setFilterStatus('') }
  function setFilterMonth(v)  { _setFilterMonth(v);  setSelected([]); setFilterStatus('') }
  function setFilterYear(v)   { _setFilterYear(parseInt(v)); setSelected([]); setFilterStatus('') }

  function getPayment(studentId) {
    return payments.find(p =>
      p.student_id === studentId &&
      p.month      === filterMonth &&
      p.year       === filterYear
    )
  }

  const branchFiltered  = students.filter(s => !filterBranch || s.branch_id === filterBranch)
  const paidStudents    = branchFiltered.filter(s =>  !!getPayment(s.id))
  const unpaidStudents  = branchFiltered.filter(s => !getPayment(s.id))
  const summaryTotal    = paidStudents.reduce((acc, s) => acc + parseFloat(getPayment(s.id)?.amount || 0), 0)

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
    const ids        = displayUnpaid.map(s => s.id)
    const allPicked  = ids.every(id => selected.includes(id))
    setSelected(allPicked ? [] : ids)
  }

  function clearSelection() { setSelected([]) }

  // Creates a single payment and returns it. Caller decides when to send TG and close modal.
  async function createSinglePayment(student, { amount, method, date }) {
    setProcessing(true)
    try {
      const payment = await createPayment({
        student_id:     student.id,
        branch_id:      student.branch_id,
        amount:         parseFloat(amount) || student.monthly_fee,
        month:          filterMonth,
        year:           filterYear,
        paid_date:      date,
        payment_method: method,
        issued_by:      session?.teacherName || 'Admin',
      })
      setPayments(prev => [...prev, payment])
      return payment
    } finally {
      setProcessing(false)
    }
  }

  async function recordBatch() {
    if (selected.length === 0) return
    if (!window.confirm(`Record payment for ${selected.length} students?`)) return
    setProcessing(true)
    const newPayments = []
    try {
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
            paid_date:      getMYT(),
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
        let sent = 0, failed = 0
        for (const payment of newPayments) {
          try { await sendTelegramReceipt(payment); sent++ }
          catch { failed++ }
        }
        alert(
          `✅ ${newPayments.length} payments recorded!\n` +
          `📱 ${sent} receipts sent via Telegram` +
          (failed > 0 ? `\n⚠️ ${failed} failed (no Telegram linked)` : '')
        )
      } else {
        alert(`✅ ${newPayments.length} payments recorded!`)
      }

      setBatchSendTG(false)
    } finally {
      setProcessing(false)
    }
  }

  async function sendSingleTelegram(payment) {
    setSending(payment.id)
    try {
      await sendTelegramReceipt(payment)
      alert('Receipt sent via Telegram! ✅')
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(null)
    }
  }

  return {
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
    displayPaid,  displayUnpaid, branchFiltered,
    // operation state
    processing, sending,
    // actions
    getPayment,
    createSinglePayment,
    recordBatch,
    sendSingleTelegram,
  }
}
