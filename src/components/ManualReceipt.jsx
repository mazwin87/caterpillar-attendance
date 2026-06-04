import { useEffect, useState } from 'react'
import { getStudents, getBranches, createPayment, supabase } from '../lib/supabase'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque']

function generateReceiptHTML(payment, baseUrl = '') {
  const s = payment.students
  const b = s?.branches
  const today = new Date(payment.paid_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>Receipt ${payment.receipt_no}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: #fff; padding: 32px; max-width: 700px; margin: 0 auto; }
      .header { display: flex; align-items: flex-start; gap: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 20px; }
      .logo { width: 90px; height: 90px; object-fit: contain; flex-shrink: 0; }
      .company h1 { font-size: 20px; font-weight: 700; color: #1a1a1a; text-transform: uppercase; margin-bottom: 4px; }
      .company p { font-size: 11px; color: #333; line-height: 1.6; }
      .receipt-no { margin-left: auto; text-align: right; flex-shrink: 0; }
      .receipt-no .label { font-size: 12px; color: #888; }
      .receipt-no .num { font-size: 28px; font-weight: 700; color: #c0392b; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
      .info-row .field { display: flex; gap: 8px; align-items: center; }
      .info-row .field label { font-weight: 600; }
      .info-row .field span { border-bottom: 1px solid #999; min-width: 200px; padding-bottom: 2px; }
      .fee-section { margin-bottom: 16px; }
      .fee-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
      .fee-item { display: flex; align-items: center; gap: 6px; font-size: 13px; }
      .checkbox { width: 14px; height: 14px; border: 1.5px solid #333; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
      .checkbox.checked { background: #1a1a1a; color: #fff; }
      .months { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 12px 0; }
      .month-item { text-align: center; font-size: 11px; }
      .month-item .box { width: 24px; height: 24px; border: 1.5px solid #333; margin: 0 auto 2px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
      .month-item .box.checked { background: #1a1a1a; color: #fff; }
      .amount-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 13px; font-weight: 600; }
      .amount-line { border-bottom: 1px solid #999; min-width: 120px; padding-bottom: 2px; }
      .total-section { border-top: 2px solid #1a1a1a; padding-top: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
      .total-label { font-size: 16px; font-weight: 700; }
      .total-line { border-bottom: 2px solid #1a1a1a; min-width: 160px; font-size: 16px; font-weight: 700; padding-bottom: 2px; }
      .footer { display: flex; justify-content: space-between; align-items: flex-start; font-size: 12px; border-top: 1px solid #ddd; padding-top: 12px; }
      .method-options { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
      .method-opt { display: flex; align-items: center; gap: 4px; font-size: 12px; }
      .note { font-size: 11px; color: #555; margin-top: 8px; }
      @media print { body { padding: 16px; } @page { margin: 10mm; } }
    </style></head><body>
      <div class="header">
        <img src="${baseUrl}/logo.png" class="logo" alt="Logo" crossorigin="anonymous" />
        <div class="company">
          <h1>Caterpillar Playtime Child Care Centre</h1>
          <p>${b?.reg_no || ''}</p><p>${b?.address || ''}</p>
          <p>📞 ${b?.phone || ''} &nbsp;🌐 ${b?.website || ''} &nbsp;✉️ ${b?.email || ''}</p>
        </div>
        <div class="receipt-no"><div class="label">№</div><div class="num">${payment.receipt_no?.split('-').pop() || payment.receipt_no}</div></div>
      </div>
      <div class="info-row">
        <div class="field"><label>Name:</label><span>${s?.name || ''}</span></div>
        <div class="field"><label>Date:</label><span>${today}</span></div>
      </div>
      <div class="fee-section">
        <div class="fee-row">
          <div class="fee-item"><div class="checkbox checked">✓</div><span>Monthly Fee</span></div>
          <div class="fee-item"><div class="checkbox"></div><span>Enrollment Fee</span></div>
          <div class="fee-item"><div class="checkbox"></div><span>Transit</span></div>
        </div>
        <div class="months">
          ${MONTHS.map(m => `<div class="month-item"><div class="box ${m === payment.month ? 'checked' : ''}">${m === payment.month ? '✓' : ''}</div><div>${m.substring(0,3)}</div></div>`).join('')}
        </div>
        <div class="amount-row"><span>RM</span><span class="amount-line">${parseFloat(payment.amount).toFixed(2)}</span></div>
      </div>
      <div class="fee-section" style="border-top:1px solid #ddd;padding-top:12px;margin-bottom:16px;">
        <div class="fee-row" style="margin-bottom:8px;">
          <div class="fee-item"><div class="checkbox"></div><span>Learning Materials</span></div>
          <div class="fee-item"><div class="checkbox"></div><span>Child Care (Full Day)</span></div>
          <div class="fee-item"><div class="checkbox"></div><span>Misc.</span></div>
        </div>
        <div class="fee-row">
          <div class="fee-item"><div class="checkbox"></div><span>Other Fee</span></div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <div class="fee-item"><div class="checkbox"></div><span>Registration</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Insurance</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Transport</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Uniform</span></div>
          </div>
        </div>
        <div class="fee-row" style="margin-top:8px;">
          <div style="width:14px;"></div>
          <div class="fee-item"><div class="checkbox"></div><span>Child Care (Half Day)</span></div>
          <div class="fee-item"><div class="checkbox"></div><span>Emergency Child Care</span></div>
          <div class="fee-item"><div class="checkbox"></div><span>Others</span></div>
        </div>
        <div class="amount-row" style="margin-top:10px;"><span>RM</span><span class="amount-line"></span></div>
      </div>
      <div class="total-section">
        <span class="total-label">TOTAL RM</span>
        <span class="total-line">${parseFloat(payment.amount).toFixed(2)}</span>
      </div>
      <div class="footer">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
            <span>Payment Method:</span>
            <div class="method-options">
              ${['Bank Transfer','Cheque','Cash'].map(m => `<div class="method-opt"><div class="checkbox ${payment.payment_method === m ? 'checked' : ''}">${payment.payment_method === m ? '✓' : ''}</div><span>${m}</span></div>`).join(' ')}
            </div>
          </div>
          <div style="margin-top:6px;font-size:12px;">Date &amp; time: ${today}</div>
          <div class="note">All Fees paid are non refundable / transferable.</div>
        </div>
        <div style="text-align:right;font-style:italic;">
          <div style="margin-bottom:20px;">Issued by</div>
          <div style="border-top:1px solid #999;min-width:120px;padding-top:4px;font-size:11px;">${payment.issued_by || 'Admin'}</div>
        </div>
      </div>
    </body></html>`
}

export default function ManualReceipt({ session }) {
  const [students, setStudents]         = useState([])
  const [branches, setBranches]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [generating, setGenerating]     = useState(false)
  const [sending, setSending]           = useState(false)
  const [generated, setGenerated]       = useState([]) // array of payment records
  const [form, setForm] = useState({
    branch_id:      '',
    student_id:     '',
    months:         [],
    year:           new Date().getFullYear(),
    amount:         '',
    payment_method: 'Cash',
    paid_date:      new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    Promise.all([getStudents(), getBranches()])
      .then(([s, b]) => { setStudents(s); setBranches(b) })
      .finally(() => setLoading(false))
  }, [])

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

    // Generate in month order
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

    // Auto open + print all receipts in ONE window
if (payments.length > 0) {
  const win = window.open('', '_blank')

  const receiptBodies = payments.map(p => {
    const s = p.students
    const b = s?.branches
    const today = new Date(p.paid_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
    return `
      <div class="receipt-wrap">
        <div class="header">
          <img src="${window.location.origin}/logo.png" class="logo" alt="Logo" />
          <div class="company">
            <h1>Caterpillar Playtime Child Care Centre</h1>
            <p>${b?.reg_no || ''}</p>
            <p>${b?.address || ''}</p>
            <p>📞 ${b?.phone || ''} &nbsp;🌐 ${b?.website || ''} &nbsp;✉️ ${b?.email || ''}</p>
          </div>
          <div class="receipt-no">
            <div class="label">№</div>
            <div class="num">${p.receipt_no?.split('-').pop() || p.receipt_no}</div>
          </div>
        </div>
        <div class="info-row">
          <div class="field"><label>Name:</label><span>${s?.name || ''}</span></div>
          <div class="field"><label>Date:</label><span>${today}</span></div>
        </div>
        <div class="fee-section">
          <div class="fee-row">
            <div class="fee-item"><div class="checkbox checked">✓</div><span>Monthly Fee</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Enrollment Fee</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Transit</span></div>
          </div>
          <div class="months">
            ${MONTHS.map(m => `
              <div class="month-item">
                <div class="box ${m === p.month ? 'checked' : ''}">${m === p.month ? '✓' : ''}</div>
                <div>${m.substring(0,3)}</div>
              </div>
            `).join('')}
          </div>
          <div class="amount-row"><span>RM</span><span class="amount-line">${parseFloat(p.amount).toFixed(2)}</span></div>
        </div>
        <div class="fee-section other">
          <div class="fee-row">
            <div class="fee-item"><div class="checkbox"></div><span>Learning Materials</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Child Care (Full Day)</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Misc.</span></div>
          </div>
          <div class="fee-row">
            <div class="fee-item"><div class="checkbox"></div><span>Other Fee</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Registration</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Insurance</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Transport</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Uniform</span></div>
          </div>
          <div class="fee-row">
            <div style="width:14px;"></div>
            <div class="fee-item"><div class="checkbox"></div><span>Child Care (Half Day)</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Emergency Child Care</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Others</span></div>
          </div>
          <div class="amount-row"><span>RM</span><span class="amount-line"></span></div>
        </div>
        <div class="total-section">
          <span class="total-label">TOTAL RM</span>
          <span class="total-line">${parseFloat(p.amount).toFixed(2)}</span>
        </div>
        <div class="footer">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
              <span>Payment Method:</span>
              ${['Bank Transfer','Cheque','Cash'].map(m => `
                <div class="method-opt">
                  <div class="checkbox ${p.payment_method === m ? 'checked' : ''}">${p.payment_method === m ? '✓' : ''}</div>
                  <span>${m}</span>
                </div>
              `).join('')}
            </div>
            <div style="margin-top:6px;font-size:12px;">Date &amp; time: ${today}</div>
            <div class="note">All Fees paid are non refundable / transferable.</div>
          </div>
          <div style="text-align:right;font-style:italic;">
            <div style="margin-bottom:20px;">Issued by</div>
            <div style="border-top:1px solid #999;min-width:120px;padding-top:4px;font-size:11px;">${p.issued_by || 'Admin'}</div>
          </div>
        </div>
      </div>
    `
  }).join('')

  win.document.write(`<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Receipts — ${selectedStudent?.name}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: #fff; }
      .receipt-wrap { padding: 32px; max-width: 700px; margin: 0 auto; page-break-after: always; }
      .receipt-wrap:last-child { page-break-after: avoid; }
      .header { display: flex; align-items: flex-start; gap: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 20px; }
      .logo { width: 90px; height: 90px; object-fit: contain; flex-shrink: 0; }
      .company h1 { font-size: 20px; font-weight: 700; color: #1a1a1a; text-transform: uppercase; margin-bottom: 4px; }
      .company p { font-size: 11px; color: #333; line-height: 1.6; }
      .receipt-no { margin-left: auto; text-align: right; flex-shrink: 0; }
      .receipt-no .label { font-size: 12px; color: #888; }
      .receipt-no .num { font-size: 28px; font-weight: 700; color: #c0392b; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
      .info-row .field { display: flex; gap: 8px; align-items: center; }
      .info-row .field label { font-weight: 600; }
      .info-row .field span { border-bottom: 1px solid #999; min-width: 200px; padding-bottom: 2px; }
      .fee-section { margin-bottom: 16px; }
      .fee-section.other { border-top: 1px solid #ddd; padding-top: 12px; }
      .fee-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
      .fee-item { display: flex; align-items: center; gap: 6px; font-size: 13px; }
      .checkbox { width: 14px; height: 14px; border: 1.5px solid #333; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
      .checkbox.checked { background: #1a1a1a; color: #fff; }
      .months { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 12px 0; }
      .month-item { text-align: center; font-size: 11px; }
      .month-item .box { width: 24px; height: 24px; border: 1.5px solid #333; margin: 0 auto 2px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
      .month-item .box.checked { background: #1a1a1a; color: #fff; }
      .amount-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 13px; font-weight: 600; }
      .amount-line { border-bottom: 1px solid #999; min-width: 120px; padding-bottom: 2px; }
      .total-section { border-top: 2px solid #1a1a1a; padding-top: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
      .total-label { font-size: 16px; font-weight: 700; }
      .total-line { border-bottom: 2px solid #1a1a1a; min-width: 160px; font-size: 16px; font-weight: 700; padding-bottom: 2px; }
      .footer { display: flex; justify-content: space-between; align-items: flex-start; font-size: 12px; border-top: 1px solid #ddd; padding-top: 12px; }
      .method-opt { display: flex; align-items: center; gap: 4px; font-size: 12px; }
      .note { font-size: 11px; color: #555; margin-top: 8px; }
      @media print { @page { margin: 10mm; } }
    </style>
  </head>
  <body>${receiptBodies}</body>
  </html>`)

  win.document.close()
  win.onload = () => win.print()
}
  }

  async function handleSendTelegram() {
    if (generated.length === 0) return
    setSending(true)

    try {
      const { data: parent } = await supabase
        .from('parents')
        .select('telegram_chat_id, name')
        .eq('student_id', form.student_id)
        .single()

      if (!parent?.telegram_chat_id) {
        alert('Parent has no Telegram linked. Please share the receipts manually.')
        setSending(false)
        return
      }

      const BOT_TOKEN = '8728256755:AAHlNR5j7UlZqi-y4IomHu2pD0kSrBLyZuY'
      const student = students.find(s => s.id === form.student_id)
      const sortedPayments = [...generated].sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month))

      const totalAmount = sortedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      const monthsList = sortedPayments.map(p => p.month).join(', ')

      const msg =
        `🧾 *Receipts — ${sortedPayments.length} month${sortedPayments.length > 1 ? 's' : ''}*\n\n` +
        `👦 Student: ${student?.name}\n` +
        `📅 Months: ${monthsList} ${form.year}\n` +
        `💰 Total: RM ${totalAmount.toFixed(2)}\n` +
        `💳 Payment: ${form.payment_method}\n` +
        `📆 Date: ${new Date(form.paid_date).toLocaleDateString('en-MY')}\n\n` +
        `_Thank you for your payment! 🙏_\n_Caterpillar Playtime_`

      // Build inline buttons — one per month receipt
      const inline_keyboard = sortedPayments.map(p => ([{
        text: `🧾 ${p.month} ${p.year} — RM ${parseFloat(p.amount).toFixed(2)}`,
        url: `https://nimonimo.tech/receipt/${p.id}`
      }]))

      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: parent.telegram_chat_id,
          text: msg,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard }
        })
      })

      const result = await res.json()
      if (result.ok) alert(`✅ ${sortedPayments.length} receipt${sortedPayments.length > 1 ? 's' : ''} sent to parent via Telegram!`)
      else alert('Telegram error: ' + result.description)
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

  const inp = {
    style: {
      width: '100%', background: 'var(--bg)', border: '0.5px solid var(--border)',
      borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--text)', outline: 'none'
    }
  }

  const selectedStudent = students.find(s => s.id === form.student_id)

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 'var(--navbar-height)' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Admin · Receipts</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Manual Receipt Generator</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Generate receipts for one or multiple months at once</div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {generated.length === 0 ? (
          <>
            {/* Branch & Student */}
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>Student</div>
              <select value={form.branch_id}
                onChange={e => setForm(f => ({ ...f, branch_id: e.target.value, student_id: '' }))} {...inp}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={form.student_id}
                onChange={e => {
                  const s = students.find(s => s.id === e.target.value)
                  setForm(f => ({ ...f, student_id: e.target.value, amount: s?.monthly_fee || '' }))
                }} {...inp}>
                <option value="">Select student</option>
                {students
                  .filter(s => !form.branch_id || s.branch_id === form.branch_id)
                  .map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_no})</option>)
                }
              </select>
              {selectedStudent && (
                <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--present)' }}>
                  Monthly fee: RM {parseFloat(selectedStudent.monthly_fee || 0).toFixed(2)}
                </div>
              )}
            </div>

            {/* Month selector */}
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                  Select months
                  {form.months.length > 0 && <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--present-bg)', color: 'var(--present)', padding: '2px 8px', borderRadius: 10 }}>{form.months.length} selected</span>}
                </div>
                <button onClick={selectAllMonths}
                  style={{ fontSize: 11, color: 'var(--present)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  {form.months.length === 12 ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {/* Year selector */}
              <select value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                style={{ ...inp.style, marginBottom: 12 }}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              {/* Month grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {MONTHS.map(m => {
                  const selected = form.months.includes(m)
                  return (
                    <button key={m} type="button" onClick={() => toggleMonth(m)}
                      style={{
                        padding: '8px 4px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                        textAlign: 'center', transition: 'all 0.15s',
                        background: selected ? 'var(--present)' : 'var(--bg)',
                        color: selected ? '#fff' : 'var(--muted)',
                        border: `0.5px solid ${selected ? 'var(--present)' : 'var(--border)'}`,
                        fontWeight: selected ? 500 : 400,
                      }}>
                      {m.substring(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Amount & Payment */}
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>Payment details</div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Amount per month (RM)</div>
                <input type="number" step="0.01" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" {...inp} />
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
                    <button key={m} type="button" onClick={() => setForm(f => ({ ...f, payment_method: m }))}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                        background: form.payment_method === m ? 'var(--present)' : 'var(--bg)',
                        color: form.payment_method === m ? '#fff' : 'var(--muted)',
                        border: `0.5px solid ${form.payment_method === m ? 'var(--present)' : 'var(--border)'}`,
                        fontWeight: form.payment_method === m ? 500 : 400,
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Payment date</div>
                <input type="date" value={form.paid_date}
                  onChange={e => setForm(f => ({ ...f, paid_date: e.target.value }))} {...inp} />
              </div>
            </div>

            {/* Summary before generating */}
            {form.student_id && form.months.length > 0 && form.amount && (
              <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--present)', marginBottom: 6 }}>
                  Ready to generate {form.months.length} receipt{form.months.length > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.8 }}>
                  <div>👦 {selectedStudent?.name}</div>
                  <div>📅 {[...form.months].sort((a,b) => MONTHS.indexOf(a) - MONTHS.indexOf(b)).join(', ')} {form.year}</div>
                  <div>💰 RM {parseFloat(form.amount).toFixed(2)} × {form.months.length} = RM {(parseFloat(form.amount) * form.months.length).toFixed(2)}</div>
                  <div>💳 {form.payment_method}</div>
                </div>
              </div>
            )}

            <button onClick={handleGenerate}
              disabled={generating || !form.student_id || form.months.length === 0 || !form.amount}
              style={{
                background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 10,
                padding: '14px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                opacity: (generating || !form.student_id || form.months.length === 0 || !form.amount) ? 0.5 : 1
              }}>
              {generating ? `Generating ${form.months.length} receipts...` : `Generate & Print ${form.months.length > 0 ? form.months.length : ''} Receipt${form.months.length > 1 ? 's' : ''}`}
            </button>
          </>
        ) : (
          /* Generated results */
          <>
            <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--present)', marginBottom: 8 }}>
                ✅ {generated.length} receipt{generated.length > 1 ? 's' : ''} generated!
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...generated]
                  .sort((a,b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month))
                  .map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 8, padding: '8px 12px', border: '0.5px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.month} {p.year}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.receipt_no} · {p.payment_method}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--present)' }}>RM {parseFloat(p.amount).toFixed(2)}</div>
                        <button onClick={() => window.open(`/receipt/${p.id}`, '_blank')}
                          style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: 'var(--text)', cursor: 'pointer' }}>
                          🔗
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--present)', marginTop: 10, paddingTop: 10, borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total collected</span>
                <span>RM {generated.reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <button onClick={handleSendTelegram} disabled={sending}
              style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 500, color: 'var(--holiday)', cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
              {sending ? 'Sending...' : `📱 Send ${generated.length} Receipt${generated.length > 1 ? 's' : ''} via Telegram`}
            </button>

            <button onClick={resetForm}
              style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '14px', fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>
              Generate another
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}