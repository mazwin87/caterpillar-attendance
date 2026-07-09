import { PAYMENT_METHODS } from '../../lib/constants'

export default function FeeBatchToolbar({ count, payMethod, onMethodChange, onRecord, onClear, processing, sendTG, onToggleSendTG }) {
  return (
    <div className="lg:max-w-5xl lg:mx-auto mx-4 mt-3 bg-present-bg border border-present rounded-xl px-3.5 py-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="text-[13px] font-medium text-present flex-1">{count} selected</div>
        <select value={payMethod} onChange={e => onMethodChange(e.target.value)}
          className="bg-page border border-border rounded-lg px-2.5 py-1.5 text-xs text-ink outline-none">
          {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button onClick={onRecord} disabled={processing}
          className="bg-present text-white border-0 rounded-lg px-4 py-2 text-xs font-medium cursor-pointer disabled:opacity-60">
          {processing ? 'Processing...' : `Record ${count} payments`}
        </button>
        <button onClick={onClear}
          className="bg-transparent border-0 text-lg text-muted cursor-pointer">×</button>
      </div>

      <div onClick={() => onToggleSendTG(!sendTG)}
        className={`flex items-center gap-2.5 px-3 py-2 bg-page rounded-[10px] border cursor-pointer ${
          sendTG ? 'border-present' : 'border-border'
        }`}>
        <div className={`w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center flex-shrink-0 ${
          sendTG ? 'border-present bg-present' : 'border-border bg-transparent'
        }`}>
          {sendTG && <span className="text-white text-[10px] font-bold">✓</span>}
        </div>
        <div className="text-xs text-ink">Send receipt via Telegram to all selected parents</div>
      </div>
    </div>
  )
}
