import { useState } from 'react'
import { createPayment, supabase } from '../lib/supabase'
import { MONTHS } from '../lib/constants'
import { renderReceiptDocument } from '../lib/receiptTemplate'
import { useBranches } from '../hooks/useBranches'
import { useStudents } from '../hooks/useStudents'
import { CenteredSpinner } from './ui/Spinner'
import ReceiptForm from './manual-receipt/ReceiptForm'
import GeneratedReceiptsList from './manual-receipt/GeneratedReceiptsList'

export default function ManualReceipt({ session }) {
  const { branches } = useBranches()
  const { students, loading } = useStudents()
  const [generating, setGenerating] = useState(false)
  const [sending, setSending]       = useState(false)
  const [generated, setGenerated]   = useState([]) // array of payment records
  const [form, setForm] = useState({
    branch_id:      '',
    student_id:     '',
    months:         [],
    year:           new Date().getFullYear(),
    amount:         '',
    payment_method: 'Cash',
    paid_date:      new Date().toISOString().split('T')[0],
  })

  function toggleMonth(month) {
    setForm(f => ({
      ...f,
      months: f.months.includes(month)
        ? f.months.filter(m => m !== month)
        : [...f.months, month]
    }))
  }

  function selectAllMonths() {
    setForm(f => ({
      ...f,
      months: f.months.length === 12 ? [] : [...MONTHS]
    }))
  }

  async function handleGenerate() {
    if (!form.student_id) { alert('Please select a student'); return }
    if (form.months.length === 0) { alert('Please select at least one month'); return }
    if (!form.amount) { alert('Please enter an amount'); return }

    setGenerating(true)
    const payments = []
    const sortedMonths = [...form.months].sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b))

    for (const month of sortedMonths) {
      try {
        const payment = await createPayment({
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

    setGenerated(payments)
    setGenerating(false)

    if (payments.length > 0) {
      const win = window.open('', '_blank')
      win.document.write(renderReceiptDocument(payments, window.location.origin))
      win.document.close()
      win.onload = () => win.print()
    }
  }

  async function handleSendTelegram() {
    if (generated.length === 0) return
    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('send_payment_notification', {
        body: { payment_ids: generated.map(p => p.id) },
      })
      if (error) { alert('Failed: ' + error.message); return }
      if (!data.ok) {
        alert(data.error === 'no_telegram' ? 'Parent has no Telegram linked. Please share the receipts manually.' : 'Telegram error: ' + (data.description || data.error))
      } else {
        alert(`✅ ${generated.length} receipt${generated.length > 1 ? 's' : ''} sent to parent via Telegram!`)
      }
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  function resetForm() {
    setForm({
      branch_id: '', student_id: '', months: [],
      year: new Date().getFullYear(), amount: '',
      payment_method: 'Cash',
      paid_date: new Date().toISOString().split('T')[0],
    })
    setGenerated([])
  }

  const selectedStudent = students.find(s => s.id === form.student_id)

  return (
    <div className="min-h-full bg-page" style={{ paddingBottom: 'var(--navbar-height)' }}>

      {/* Header */}
      <div className="pt-[52px] lg:pt-8 bg-surface border-b border-border pb-5 px-5">
       <div className="lg:max-w-2xl lg:mx-auto">
        <div className="text-[11px] text-muted tracking-[0.08em] uppercase mb-1">Admin · Receipts</div>
        <div className="text-[22px] font-medium text-ink">Manual Receipt Generator</div>
        <div className="text-[13px] text-muted mt-1">Generate receipts for one or multiple months at once</div>
       </div>
      </div>

      <div className="lg:max-w-2xl lg:mx-auto p-4 flex flex-col gap-3">
        {loading ? (
          <CenteredSpinner padding={48} />
        ) : generated.length === 0 ? (
          <ReceiptForm
            form={form}
            setForm={setForm}
            branches={branches}
            students={students}
            selectedStudent={selectedStudent}
            onToggleMonth={toggleMonth}
            onSelectAllMonths={selectAllMonths}
            onGenerate={handleGenerate}
            generating={generating}
          />
        ) : (
          <GeneratedReceiptsList
            generated={generated}
            sending={sending}
            onSendTelegram={handleSendTelegram}
            onReset={resetForm}
          />
        )}
      </div>
    </div>
  )
}
