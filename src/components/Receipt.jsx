import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MONTHS } from '../lib/constants'
import Spinner from './ui/Spinner'

const checkboxBase = "w-3.5 h-3.5 border-[1.5px] border-[#333] flex-shrink-0 flex items-center justify-center text-[10px] font-bold"

function Checkbox({ checked }) {
  return (
    <div className={checkboxBase} style={{ background: checked ? '#1a1a1a' : '#fff', color: checked ? '#fff' : 'transparent' }}>✓</div>
  )
}

export default function Receipt() {
  const { id } = useParams()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase
      .from('payments')
      .select('*, students(name, student_no, branches(name, address, phone, email, website, reg_no))')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setPayment(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <Spinner color="var(--primary)" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-page">
      <div className="text-5xl">🔍</div>
      <div className="text-lg font-medium text-ink">Receipt not found</div>
      <div className="text-[13px] text-muted">This receipt may have been deleted or the link is invalid.</div>
    </div>
  )

  const s = payment.students
  const b = s?.branches
  const today = new Date(payment.paid_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-page px-4 py-6">
      <div id="receipt-content" className="bg-white max-w-[680px] mx-auto p-8 rounded-lg shadow-[0_2px_16px_rgba(0,0,0,0.08)]" style={{ fontFamily: 'Arial, sans-serif' }}>

        {/* Header */}
        <div className="flex items-start gap-4 border-b-2 border-[#1a1a1a] pb-4 mb-5">
          <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain flex-shrink-0" />
          <div className="flex-1">
            <div className="text-lg font-bold text-[#1a1a1a] uppercase mb-1">
              Caterpillar Playtime Child Care Centre
            </div>
            <div className="text-[11px] text-[#333] leading-relaxed">
              <div>{b?.reg_no}</div>
              <div>{b?.address}</div>
              <div>📞 {b?.phone} &nbsp;🌐 {b?.website} &nbsp;✉️ {b?.email}</div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[11px] text-[#888]">№</div>
            <div className="text-[28px] font-bold text-[#c0392b]">
              {payment.receipt_no?.split('-').pop()}
            </div>
            <div className="text-[10px] text-[#888] mt-0.5">{payment.receipt_no}</div>
          </div>
        </div>

        {/* Name & Date */}
        <div className="flex justify-between mb-5 text-[13px] border-b border-[#e0e0e0] pb-3">
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Name:</span>
            <span className="border-b border-[#999] min-w-[200px] pb-0.5">{s?.name}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Date:</span>
            <span className="border-b border-[#999] pb-0.5">{today}</span>
          </div>
        </div>

        {/* Fee type checkboxes */}
        <div className="mb-4">
          <div className="flex gap-6 mb-3 flex-wrap">
            {[
              { label: 'Enrollment Fee', checked: false },
              { label: 'Monthly Fee',    checked: true  },
              { label: 'Transit',        checked: false },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-[13px]">
                <Checkbox checked={item.checked} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Month checkboxes */}
          <div className="flex gap-2.5 flex-wrap mb-3">
            {MONTHS.map(m => (
              <div key={m} className="text-center text-[11px]">
                <div className="w-6 h-6 border-[1.5px] border-[#333] mx-auto mb-0.5 flex items-center justify-center text-[10px] font-bold"
                  style={{ background: m === payment.month ? '#1a1a1a' : '#fff', color: m === payment.month ? '#fff' : 'transparent' }}>✓</div>
                <div>{m.substring(0, 3)}</div>
              </div>
            ))}
          </div>

          {/* Amount */}
          <div className="flex items-center gap-2 text-[13px] font-semibold mb-4">
            <span>RM</span>
            <span className="border-b border-[#999] min-w-[120px] pb-0.5">
              {parseFloat(payment.amount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Other fees (empty) */}
        <div className="border-t border-[#ddd] pt-3 mb-4">
          <div className="flex gap-5 flex-wrap mb-2">
            {['Learning Materials', 'Child Care (Full Day)', 'Misc.'].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-xs">
                <div className="w-3.5 h-3.5 border-[1.5px] border-[#333] flex-shrink-0"></div>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap mb-2">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3.5 h-3.5 border-[1.5px] border-[#333] flex-shrink-0"></div>
              <span>Other Fee</span>
            </div>
            {['Registration', 'Insurance', 'Transport', 'Uniform'].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-xs">
                <div className="w-3.5 h-3.5 border-[1.5px] border-[#333] flex-shrink-0"></div>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap mb-2 ml-5">
            {['Child Care (Half Day)', 'Emergency Child Care', 'Others'].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-xs">
                <div className="w-3.5 h-3.5 border-[1.5px] border-[#333] flex-shrink-0"></div>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <span>RM</span>
            <span className="border-b border-[#999] min-w-[120px] pb-0.5"></span>
          </div>
        </div>

        {/* Total */}
        <div className="border-t-2 border-[#1a1a1a] pt-3 mb-5 flex items-center gap-3">
          <span className="text-base font-bold">TOTAL RM</span>
          <span className="border-b-2 border-[#1a1a1a] min-w-[160px] text-base font-bold pb-0.5">
            {parseFloat(payment.amount).toFixed(2)}
          </span>
        </div>

        {/* Footer */}
        <div className="border-t border-[#ddd] pt-3 flex justify-between items-start text-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span>Payment Method:</span>
              {['Bank Transfer', 'Cheque', 'Cash'].map(m => (
                <div key={m} className="flex items-center gap-1">
                  <Checkbox checked={payment.payment_method === m} />
                  <span>{m}</span>
                </div>
              ))}
            </div>
            <div className="mb-1.5">
              Date &amp; time: {today}
            </div>
            <div className="text-[11px] text-[#555]">All Fees paid are non refundable / transferable.</div>
          </div>
          <div className="text-right italic">
            <div className="mb-5">Issued by</div>
            <div className="border-t border-[#999] min-w-[120px] pt-1 text-[11px]">
              {payment.issued_by || 'Admin'}
            </div>
          </div>
        </div>

      </div>

      {/* Print button */}
      <div className="max-w-[680px] mx-auto my-4 text-center">
        <button onClick={() => window.print()}
          className="bg-primary text-white border-0 rounded-[10px] px-8 py-3 text-sm font-medium cursor-pointer">
          🖨️ Print Receipt
        </button>
      </div>

      <style>{`
        @media print {
          body { background: #fff; }
          button { display: none !important; }
          #receipt-content { box-shadow: none; border-radius: 0; padding: 16px; }
        }
      `}</style>
    </div>
  )
}
