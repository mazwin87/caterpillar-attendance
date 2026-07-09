import { MONTHS } from '../../lib/constants'

export default function GeneratedReceiptsList({ generated, sending, onSendTelegram, onReset }) {
  const sorted = [...generated].sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month))
  const total = generated.reduce((s, p) => s + parseFloat(p.amount), 0)

  return (
    <>
      <div className="bg-present-bg border border-present rounded-xl p-4">
        <div className="text-[15px] font-medium text-present mb-2">
          ✅ {generated.length} receipt{generated.length > 1 ? 's' : ''} generated!
        </div>
        <div className="flex flex-col gap-1.5">
          {sorted.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-border">
              <div>
                <div className="text-[13px] font-medium text-ink">{p.month} {p.year}</div>
                <div className="text-[11px] text-muted">{p.receipt_no} · {p.payment_method}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-present">RM {parseFloat(p.amount).toFixed(2)}</div>
                <button onClick={() => window.open(`/receipt/${p.id}`, '_blank')}
                  className="bg-page border border-border rounded-md px-2 py-1 text-[11px] text-ink cursor-pointer">
                  🔗
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs font-medium text-present mt-2.5 pt-2.5 border-t border-border flex justify-between">
          <span>Total collected</span>
          <span>RM {total.toFixed(2)}</span>
        </div>
      </div>

      <button onClick={onSendTelegram} disabled={sending}
        className="bg-holiday-bg border border-holiday rounded-[10px] py-3.5 text-sm font-medium text-holiday cursor-pointer disabled:opacity-60">
        {sending ? 'Sending...' : `📱 Send ${generated.length} Receipt${generated.length > 1 ? 's' : ''} via Telegram`}
      </button>

      <button onClick={onReset}
        className="bg-page border border-border rounded-[10px] py-3.5 text-sm text-muted cursor-pointer">
        Generate another
      </button>
    </>
  )
}
