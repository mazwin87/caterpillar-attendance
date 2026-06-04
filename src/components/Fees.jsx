import { useEffect, useState } from 'react'
import { getStudents, getBranches, createPayment, getPayments, supabase } from '../lib/supabase'

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

export default function Fees({ session }) {
  const [students, setStudents]         = useState([])
  const [branches, setBranches]         = useState([])
  const [payments, setPayments]         = useState([])
  const [loading, setLoading]           = useState(true)
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
  const [sendTG, setSendTG] = useState(false)
  const [batchSendTG, setBatchSendTG] = useState(false)

  useEffect(() => {
    Promise.all([getStudents(), getBranches(), getPayments()])
      .then(([s, b, p]) => { setStudents(s); setBranches(b); setPayments(p) })
      .finally(() => setLoading(false))
  }, [])

  function getPayment(studentId) {
    return payments.find(p =>
      p.student_id === studentId &&
      p.month === filterMonth &&
      p.year === filterYear
    )
  }

  // Base filter — branch only
  const branchFiltered = students.filter(s =>
    !filterBranch || s.branch_id === filterBranch
  )

  // Paid/unpaid from branch filtered — for summary counts
  const paidStudents   = branchFiltered.filter(s =>  !!getPayment(s.id))
  const unpaidStudents = branchFiltered.filter(s => !getPayment(s.id))
  const summaryTotal   = paidStudents.reduce((a, s) => a + parseFloat(getPayment(s.id)?.amount || 0), 0)

  // Apply status filter on top for the list
  const filteredStudents =
    filterStatus === 'paid'   ? paidStudents :
    filterStatus === 'unpaid' ? unpaidStudents :
    branchFiltered

  // Split filtered list into sections
  const displayUnpaid = filteredStudents.filter(s => !getPayment(s.id))
  const displayPaid   = filteredStudents.filter(s =>  !!getPayment(s.id))

  function toggleSelect(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function selectAllUnpaid() {
    const allUnpaidIds = displayUnpaid.map(s => s.id)
    const allSelected  = allUnpaidIds.every(id => selected.includes(id))
    if (allSelected) setSelected([])
    else setSelected(allUnpaidIds)
  }

  async function recordSingle(student) {
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

        // Send TG if checked
        if (sendTG) {
        await sendTelegram(payment)
        }
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

  // Send TG for all if checkbox ticked
  if (batchSendTG && newPayments.length > 0) {
    let sent = 0
    let failed = 0
    for (const payment of newPayments) {
      try {
        const { data: parent } = await supabase
          .from('parents').select('telegram_chat_id')
          .eq('student_id', payment.student_id).single()

        if (!parent?.telegram_chat_id) { failed++; continue }

        const BOT_TOKEN  = '8728256755:AAHlNR5j7UlZqi-y4IomHu2pD0kSrBLyZuY'
        const receiptUrl = `https://nimonimo.tech/receipt/${payment.id}`

        const msg =
          `🧾 *Receipt — ${payment.receipt_no}*\n\n` +
          `👦 Student: ${payment.students?.name}\n` +
          `📅 Month: ${payment.month} ${payment.year}\n` +
          `💰 Amount: RM ${parseFloat(payment.amount).toFixed(2)}\n` +
          `💳 Payment: ${payment.payment_method}\n` +
          `📆 Date: ${new Date(payment.paid_date).toLocaleDateString('en-MY')}\n\n` +
          `_Thank you for your payment! 🙏_\n_Caterpillar Playtime_`

        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: parent.telegram_chat_id,
            text: msg,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{
                text: `🧾 View Receipt — ${payment.students?.name} (${payment.month} ${payment.year})`,
                url: receiptUrl
              }]]
            }
          })
        })
        const result = await res.json()
        if (result.ok) sent++
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
    win.document.write(generateReceiptHTML(payment, window.location.origin))
    win.document.close()
    win.onload = () => win.print()
  }

  function openReceiptPage(payment) {
    window.open(`/receipt/${payment.id}`, '_blank')
  }

  async function sendTelegram(payment) {
    setSending(payment.id)
    try {
      const { data: parent } = await supabase
        .from('parents').select('telegram_chat_id, name')
        .eq('student_id', payment.student_id).single()

      if (!parent?.telegram_chat_id) {
        alert('Parent has no Telegram linked.')
        return
      }

      const BOT_TOKEN  = '8728256755:AAHlNR5j7UlZqi-y4IomHu2pD0kSrBLyZuY'
      const receiptUrl = `https://nimonimo.tech/receipt/${payment.id}`

      const msg =
        `🧾 *Receipt — ${payment.receipt_no}*\n\n` +
        `👦 Student: ${payment.students?.name}\n` +
        `📅 Month: ${payment.month} ${payment.year}\n` +
        `💰 Amount: RM ${parseFloat(payment.amount).toFixed(2)}\n` +
        `💳 Payment: ${payment.payment_method}\n` +
        `📆 Date: ${new Date(payment.paid_date).toLocaleDateString('en-MY')}\n\n` +
        `_Thank you for your payment! 🙏_\n_Caterpillar Playtime_`

      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: parent.telegram_chat_id,
          text: msg,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{
              text: `🧾 View Receipt — ${payment.students?.name} (${payment.month} ${payment.year})`,
              url: receiptUrl
            }]]
          }
        })
      })
      const result = await res.json()
      if (result.ok) alert('Receipt sent via Telegram! ✅')
      else alert('Telegram error: ' + result.description)
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setSending(null)
    }
  }

  const inp = {
    style: {
      width: '100%', background: 'var(--bg)', border: '0.5px solid var(--border)',
      borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--text)', outline: 'none'
    }
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 'var(--navbar-height)' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>Fees</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select value={filterBranch} onChange={e => { setFilterBranch(e.target.value); setSelected([]); setFilterStatus('') }} {...inp}>
            <option value="">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setSelected([]); setFilterStatus('') }} {...inp}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => { setFilterYear(parseInt(e.target.value)); setSelected([]); setFilterStatus('') }} {...inp}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary bar — clickable */}
      {branchFiltered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 16px 0' }}>
          <div onClick={() => setFilterStatus(filterStatus === 'paid' ? '' : 'paid')}
            style={{ background: filterStatus === 'paid' ? 'var(--present)' : 'var(--present-bg)', borderRadius: 10, padding: '10px 12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: filterStatus === 'paid' ? '#fff' : 'var(--present)' }}>{paidStudents.length}</div>
            <div style={{ fontSize: 10, color: filterStatus === 'paid' ? 'rgba(255,255,255,0.8)' : 'var(--present)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</div>
          </div>
          <div onClick={() => setFilterStatus(filterStatus === 'unpaid' ? '' : 'unpaid')}
            style={{ background: filterStatus === 'unpaid' ? 'var(--absent)' : 'var(--absent-bg)', borderRadius: 10, padding: '10px 12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: filterStatus === 'unpaid' ? '#fff' : 'var(--absent)' }}>{unpaidStudents.length}</div>
            <div style={{ fontSize: 10, color: filterStatus === 'unpaid' ? 'rgba(255,255,255,0.8)' : 'var(--absent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unpaid</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>RM {summaryTotal.toFixed(0)}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collected</div>
          </div>
        </div>
      )}

      {/* Batch toolbar */}
      {selected.length > 0 && (
        <div style={{ margin: '12px 16px 0', background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--present)', flex: 1 }}>{selected.length} selected</div>
            <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text)', outline: 'none' }}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={recordBatch} disabled={processing}
                style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: processing ? 0.6 : 1 }}>
                {processing ? 'Processing...' : `Record ${selected.length} payments`}
            </button>
            <button onClick={() => setSelected([])}
                style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--muted)', cursor: 'pointer' }}>×</button>
            </div>

            {/* Send TG checkbox */}
            <div onClick={() => setBatchSendTG(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg)', borderRadius: 10, border: `0.5px solid ${batchSendTG ? 'var(--present)' : 'var(--border)'}`, cursor: 'pointer' }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${batchSendTG ? 'var(--present)' : 'var(--border)'}`, background: batchSendTG ? 'var(--present)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {batchSendTG && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)' }}>Send receipt via Telegram to all selected parents</div>
            </div>
        </div>
        )}

      {/* Student list */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--present)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 48 }}>
            {filterBranch ? 'No students found' : 'Select a branch to view students'}
          </div>
        ) : (
          <>
            {/* Unpaid section */}
            {displayUnpaid.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Unpaid — {displayUnpaid.length}
                  </div>
                  <button onClick={selectAllUnpaid}
                    style={{ fontSize: 11, color: 'var(--present)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    {displayUnpaid.every(s => selected.includes(s.id)) ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {displayUnpaid.map(s => (
                    <div key={s.id}
                      style={{
                        border: `0.5px solid ${selected.includes(s.id) ? 'var(--present)' : 'var(--border)'}`,
                        borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                        background: selected.includes(s.id) ? 'var(--present-bg)' : 'var(--surface)',
                      }}>
                      <div onClick={() => toggleSelect(s.id)}
                        style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${selected.includes(s.id) ? 'var(--present)' : 'var(--border)'}`, background: selected.includes(s.id) ? 'var(--present)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        {selected.includes(s.id) && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--absent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: 'var(--absent)', flexShrink: 0 }}>
                        {s.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{s.student_no} · {s.branches?.name?.replace('Caterpillar Playtime ', '')}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--absent)', flexShrink: 0 }}>
                        RM {parseFloat(s.monthly_fee || 0).toFixed(0)}
                      </div>
                      <button onClick={() => { setRecordModal(s); setSingleAmount(s.monthly_fee || ''); setSingleMethod('Cash'); setSingleDate(new Date().toISOString().split('T')[0]); setSendTG(false) }}
                        style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
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
                          <button onClick={() => printReceipt(p)}
                            style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '5px 8px', fontSize: 11, color: 'var(--text)', cursor: 'pointer' }}>
                            🖨️
                          </button>
                          <button onClick={() => openReceiptPage(p)}
                            style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '5px 8px', fontSize: 11, color: 'var(--text)', cursor: 'pointer' }}>
                            🔗
                          </button>
                          <button onClick={() => sendTelegram(p)} disabled={sending === p?.id}
                            style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 8, padding: '5px 8px', fontSize: 11, color: 'var(--holiday)', cursor: 'pointer', opacity: sending === p?.id ? 0.6 : 1 }}>
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

      {/* Single record modal */}
      {recordModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setRecordModal(null)}>
          <div style={{ width: '100%', background: 'var(--surface)', borderRadius: '20px 20px 0 0', paddingTop: 24, paddingLeft: 24, paddingRight: 24, paddingBottom: 100 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Record Payment</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{recordModal.name} · {filterMonth} {filterYear}</div>
              </div>
              <button onClick={() => setRecordModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--muted)', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Amount (RM)</div>
                <input type="number" step="0.01" value={singleAmount}
                  onChange={e => setSingleAmount(e.target.value)} {...inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Payment method</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PAYMENT_METHODS.map(m => (
                    <button key={m} type="button" onClick={() => setSingleMethod(m)}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                        background: singleMethod === m ? 'var(--present)' : 'var(--bg)',
                        color: singleMethod === m ? '#fff' : 'var(--muted)',
                        border: `0.5px solid ${singleMethod === m ? 'var(--present)' : 'var(--border)'}`,
                        fontWeight: singleMethod === m ? 500 : 400 }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Payment date</div>
                <input type="date" value={singleDate}
                  onChange={e => setSingleDate(e.target.value)} {...inp} />
              </div>
              {/* Send TG checkbox */}
              <div onClick={() => setSendTG(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: `0.5px solid ${sendTG ? 'var(--present)' : 'var(--border)'}`, cursor: 'pointer' }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${sendTG ? 'var(--present)' : 'var(--border)'}`, background: sendTG ? 'var(--present)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {sendTG && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
                <div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Send receipt via Telegram</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Parent will receive receipt link instantly</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setRecordModal(null)}
                  style={{ flex: 1, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={() => recordSingle(recordModal)} disabled={processing}
                  style={{ flex: 1, background: 'var(--present)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, color: '#fff', fontWeight: 500, cursor: 'pointer', opacity: processing ? 0.6 : 1 }}>
                  {processing ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}