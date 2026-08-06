import { useManualReceipt } from '../../../hooks/useManualReceipt'
import ManualReceiptForm from './ManualReceiptForm'
import { openMultiReceiptPrintWindow } from '../../../lib/utils/print'
import { MONTHS } from '../../../lib/constants/months'

export default function ManualReceiptPage({ session }) {
  const mr = useManualReceipt(session)

  async function handleGenerate() {
    const payments = await mr.generateReceipts()
    if (payments.length > 0) {
      openMultiReceiptPrintWindow(payments, mr.selectedStudent?.name, window.location.origin)
    }
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 'var(--navbar-height)' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          Admin · Receipts
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Manual Receipt Generator</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Generate receipts for one or multiple months at once
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {mr.generated.length === 0 ? (
          <ManualReceiptForm
            students={mr.students}
            branches={mr.branches}
            form={mr.form}
            selectedStudent={mr.selectedStudent}
            selectBranch={mr.selectBranch}
            selectStudent={mr.selectStudent}
            setField={mr.setField}
            toggleMonth={mr.toggleMonth}
            selectAllMonths={mr.selectAllMonths}
            generating={mr.generating}
            onGenerate={handleGenerate}
          />
        ) : (
          /* Generated results view */
          <>
            <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--present)', marginBottom: 8 }}>
                ✅ {mr.generated.length} receipt{mr.generated.length > 1 ? 's' : ''} generated!
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...mr.generated]
                  .sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month))
                  .map(p => (
                    <div
                      key={p.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 8, padding: '8px 12px', border: '0.5px solid var(--border)' }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.month} {p.year}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.receipt_no} · {p.payment_method}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--present)' }}>
                          RM {parseFloat(p.amount).toFixed(2)}
                        </div>
                        <button
                          onClick={() => window.open(`/receipt/${p.id}`, '_blank')}
                          style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: 'var(--text)', cursor: 'pointer' }}
                        >
                          🔗
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--present)', marginTop: 10, paddingTop: 10, borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total collected</span>
                <span>RM {mr.generated.reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={mr.sendTelegram}
              disabled={mr.sending}
              style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 500, color: 'var(--holiday)', cursor: 'pointer', opacity: mr.sending ? 0.6 : 1 }}
            >
              {mr.sending
                ? 'Sending...'
                : `📱 Send ${mr.generated.length} Receipt${mr.generated.length > 1 ? 's' : ''} via Telegram`
              }
            </button>

            <button
              onClick={mr.resetForm}
              style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '14px', fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}
            >
              Generate another
            </button>
          </>
        )}
      </div>
    </div>
  )
}
