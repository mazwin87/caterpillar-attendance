import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f6' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #e0e0e0', borderTopColor: '#2d7a4f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f6', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>Receipt not found</div>
      <div style={{ fontSize: 13, color: '#888' }}>This receipt may have been deleted or the link is invalid.</div>
    </div>
  )

  const s = payment.students
  const b = s?.branches
  const today = new Date(payment.paid_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ background: '#f0f0f0', minHeight: '100vh', padding: '24px 16px' }}>
      <div id="receipt-content" style={{
        background: '#fff', maxWidth: 680, margin: '0 auto',
        padding: '32px', fontFamily: 'Arial, sans-serif', borderRadius: 8,
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, borderBottom: '2px solid #1a1a1a', paddingBottom: 16, marginBottom: 20 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', textTransform: 'uppercase', marginBottom: 4 }}>
              Caterpillar Playtime Child Care Centre
            </div>
            <div style={{ fontSize: 11, color: '#333', lineHeight: 1.7 }}>
              <div>{b?.reg_no}</div>
              <div>{b?.address}</div>
              <div>📞 {b?.phone} &nbsp;🌐 {b?.website} &nbsp;✉️ {b?.email}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#888' }}>№</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#c0392b' }}>
              {payment.receipt_no?.split('-').pop()}
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{payment.receipt_no}</div>
          </div>
        </div>

        {/* Name & Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 13, borderBottom: '1px solid #e0e0e0', paddingBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Name:</span>
            <span style={{ borderBottom: '1px solid #999', minWidth: 200, paddingBottom: 2 }}>{s?.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Date:</span>
            <span style={{ borderBottom: '1px solid #999', paddingBottom: 2 }}>{today}</span>
          </div>
        </div>

        {/* Fee type checkboxes */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Enrollment Fee', checked: false },
              { label: 'Monthly Fee',    checked: true  },
              { label: 'Transit',        checked: false },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <div style={{
                  width: 14, height: 14, border: '1.5px solid #333', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  background: item.checked ? '#1a1a1a' : '#fff',
                  color: item.checked ? '#fff' : 'transparent',
                }}>✓</div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Month checkboxes */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            {MONTHS.map(m => (
              <div key={m} style={{ textAlign: 'center', fontSize: 11 }}>
                <div style={{
                  width: 24, height: 24, border: '1.5px solid #333', margin: '0 auto 2px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  background: m === payment.month ? '#1a1a1a' : '#fff',
                  color: m === payment.month ? '#fff' : 'transparent',
                }}>✓</div>
                <div>{m.substring(0, 3)}</div>
              </div>
            ))}
          </div>

          {/* Amount */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            <span>RM</span>
            <span style={{ borderBottom: '1px solid #999', minWidth: 120, paddingBottom: 2 }}>
              {parseFloat(payment.amount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Other fees (empty) */}
        <div style={{ borderTop: '1px solid #ddd', paddingTop: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
            {['Learning Materials', 'Child Care (Full Day)', 'Misc.'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 14, height: 14, border: '1.5px solid #333', flexShrink: 0 }}></div>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <div style={{ width: 14, height: 14, border: '1.5px solid #333', flexShrink: 0 }}></div>
              <span>Other Fee</span>
            </div>
            {['Registration', 'Insurance', 'Transport', 'Uniform'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 14, height: 14, border: '1.5px solid #333', flexShrink: 0 }}></div>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8, marginLeft: 20 }}>
            {['Child Care (Half Day)', 'Emergency Child Care', 'Others'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 14, height: 14, border: '1.5px solid #333', flexShrink: 0 }}></div>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <span>RM</span>
            <span style={{ borderBottom: '1px solid #999', minWidth: 120, paddingBottom: 2 }}></span>
          </div>
        </div>

        {/* Total */}
        <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>TOTAL RM</span>
          <span style={{ borderBottom: '2px solid #1a1a1a', minWidth: 160, fontSize: 16, fontWeight: 700, paddingBottom: 2 }}>
            {parseFloat(payment.amount).toFixed(2)}
          </span>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #ddd', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span>Payment Method:</span>
              {['Bank Transfer', 'Cheque', 'Cash'].map(m => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 14, height: 14, border: '1.5px solid #333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    background: payment.payment_method === m ? '#1a1a1a' : '#fff',
                    color: payment.payment_method === m ? '#fff' : 'transparent',
                  }}>✓</div>
                  <span>{m}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 6 }}>
              Date &amp; time: {today}
            </div>
            <div style={{ fontSize: 11, color: '#555' }}>All Fees paid are non refundable / transferable.</div>
          </div>
          <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
            <div style={{ marginBottom: 20 }}>Issued by</div>
            <div style={{ borderTop: '1px solid #999', minWidth: 120, paddingTop: 4, fontSize: 11 }}>
              {payment.issued_by || 'Admin'}
            </div>
          </div>
        </div>

      </div>

      {/* Print button */}
      <div style={{ maxWidth: 680, margin: '16px auto', textAlign: 'center' }}>
        <button onClick={() => window.print()}
          style={{ background: '#2d7a4f', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          🖨️ Print Receipt
        </button>
      </div>

      <style>{`
        @media print {
          body { background: #fff; }
          button { display: none !important; }
          #receipt-content { box-shadow: none; border-radius: 0; padding: 16px; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}