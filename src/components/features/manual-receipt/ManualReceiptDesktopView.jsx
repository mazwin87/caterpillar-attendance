import { PageHeader, SplitPane } from '../../ui'
import ManualReceiptForm from './ManualReceiptForm'
import { openMultiReceiptPrintWindow } from '../../../lib/utils/print'
import { MONTHS } from '../../../lib/constants/months'

function ResultsPanel({ generated, sending, sendTelegram, resetForm }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '16px' }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--present)', marginBottom: 8 }}>
          ✅ {generated.length} receipt{generated.length > 1 ? 's' : ''} generated!
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[...generated]
            .sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month))
            .map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 8, padding: '8px 12px', border: '0.5px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.month} {p.year}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.receipt_no} · {p.payment_method}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--present)' }}>RM {parseFloat(p.amount).toFixed(2)}</div>
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
          <span>RM {generated.reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={sendTelegram}
        disabled={sending}
        style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 500, color: 'var(--holiday)', cursor: 'pointer', opacity: sending ? 0.6 : 1 }}
      >
        {sending ? 'Sending...' : `📱 Send ${generated.length} Receipt${generated.length > 1 ? 's' : ''} via Telegram`}
      </button>

      <button
        onClick={resetForm}
        style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '14px', fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}
      >
        Generate another
      </button>
    </div>
  )
}

function PreviewPlaceholder() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--muted)', textAlign: 'center', minHeight: 200 }}>
      <div style={{ fontSize: 40 }}>🧾</div>
      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>Receipt preview</div>
      <div style={{ fontSize: 13 }}>Generated receipts will appear here</div>
    </div>
  )
}

export default function ManualReceiptDesktopView({
  students, branches,
  form, selectedStudent,
  selectBranch, selectStudent, setField,
  toggleMonth, selectAllMonths,
  generating, sending, generated,
  generateReceipts, sendTelegram, resetForm,
}) {
  async function handleGenerate() {
    const payments = await generateReceipts()
    if (payments.length > 0) {
      openMultiReceiptPrintWindow(payments, selectedStudent?.name, window.location.origin)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <PageHeader title="Manual Receipt Generator" subtitle="Admin · Receipts" />
      <SplitPane
        left={
          <ManualReceiptForm
            students={students}
            branches={branches}
            form={form}
            selectedStudent={selectedStudent}
            selectBranch={selectBranch}
            selectStudent={selectStudent}
            setField={setField}
            toggleMonth={toggleMonth}
            selectAllMonths={selectAllMonths}
            generating={generating}
            onGenerate={handleGenerate}
          />
        }
        right={
          generated.length > 0
            ? <ResultsPanel generated={generated} sending={sending} sendTelegram={sendTelegram} resetForm={resetForm} />
            : <PreviewPlaceholder />
        }
      />
    </div>
  )
}
