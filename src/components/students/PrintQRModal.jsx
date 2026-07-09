import Modal from '../ui/Modal'

const inputClass = "w-full bg-page border border-border rounded-[10px] px-3.5 py-2.5 text-sm text-ink outline-none"

export default function PrintQRModal({ open, onClose, branches, printBranch, setPrintBranch, onPrint, printing }) {
  return (
    <Modal open={open} onClose={onClose} title="Print QR codes">
      <div className="flex flex-col gap-3">
        <select value={printBranch} onChange={e => setPrintBranch(e.target.value)} className={inputClass}>
          <option value="">Select branch</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="bg-holiday-bg border border-holiday rounded-[10px] px-3.5 py-2.5 text-xs text-holiday leading-relaxed">
          9 QR codes per page (3×3), A4 size. Ready to cut and laminate.
        </div>
        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 bg-page border border-border rounded-[10px] py-3 text-sm text-muted cursor-pointer">
            Cancel
          </button>
          <button onClick={onPrint} disabled={printing || !printBranch}
            className="flex-1 bg-present border-0 rounded-[10px] py-3 text-sm text-white font-medium cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5">
            🖨️ {printing ? 'Generating...' : 'Print'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
