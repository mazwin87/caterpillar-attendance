import { useEffect, useState } from 'react'
import { getStudents, getBranches, createPayment } from '../lib/supabase'
import { sendTelegramMultiReceipt } from '../lib/services/manual-receipt.service'
import { MONTHS } from '../lib/constants/months'
import { getMYT } from '../lib/utils/date'

export function useManualReceipt(session) {
  const [students, setStudents]   = useState([])
  const [branches, setBranches]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending]     = useState(false)
  const [generated, setGenerated] = useState([])
  const [form, setForm] = useState({
    branch_id:      '',
    student_id:     '',
    months:         [],
    year:           new Date().getFullYear(),
    amount:         '',
    payment_method: 'Cash',
    paid_date:      getMYT(),
  })

  useEffect(() => {
    Promise.all([getStudents(), getBranches()])
      .then(([s, b]) => { setStudents(s); setBranches(b) })
      .finally(() => setLoading(false))
  }, [])

  const selectedStudent = students.find(s => s.id === form.student_id)

  function selectBranch(branch_id) {
    setForm(f => ({ ...f, branch_id, student_id: '', amount: '' }))
  }

  function selectStudent(student_id) {
    const s = students.find(s => s.id === student_id)
    setForm(f => ({ ...f, student_id, amount: s?.monthly_fee || '' }))
  }

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleMonth(month) {
    setForm(f => ({
      ...f,
      months: f.months.includes(month)
        ? f.months.filter(m => m !== month)
        : [...f.months, month],
    }))
  }

  function selectAllMonths() {
    setForm(f => ({ ...f, months: f.months.length === 12 ? [] : [...MONTHS] }))
  }

  // Creates payment records for all selected months in chronological order.
  // Returns the created payments so the caller can open the print window.
  async function generateReceipts() {
    const sortedMonths = [...form.months].sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b))
    setGenerating(true)
    const payments = []

    for (const month of sortedMonths) {
      try {
        const payment = await createPayment({
          callerId:       session?.id,
          student_id:     form.student_id,
          branch_id:      form.branch_id,
          amount:         parseFloat(form.amount),
          month,
          year:           form.year,
          paid_date:      form.paid_date,
          payment_method: form.payment_method,
          issued_by:      session?.teacherName || 'Admin',
        })
        payments.push(payment)
      } catch (err) {
        console.error(`Failed for ${month}:`, err.message)
        alert(`Error for ${month}: ${err.message}`)
      }
    }

    setGenerating(false)
    setGenerated(payments)
    return payments
  }

  async function sendTelegram() {
    if (generated.length === 0) return
    setSending(true)
    try {
      const { sent } = await sendTelegramMultiReceipt({
        payments:      generated,
        student:       selectedStudent,
        paymentMethod: form.payment_method,
        paidDate:      form.paid_date,
      })
      alert(`✅ ${sent} receipt${sent > 1 ? 's' : ''} sent to parent via Telegram!`)
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  function resetForm() {
    setForm({
      branch_id: '', student_id: '', months: [],
      year: new Date().getFullYear(), amount: '',
      payment_method: 'Cash',
      paid_date: getMYT(),
    })
    setGenerated([])
  }

  return {
    students, branches, loading,
    generating, sending, generated,
    form, selectedStudent,
    selectBranch, selectStudent, setField,
    toggleMonth, selectAllMonths,
    generateReceipts,
    sendTelegram,
    resetForm,
  }
}
