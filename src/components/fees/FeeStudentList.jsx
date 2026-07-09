import { CenteredSpinner } from '../ui/Spinner'
import { cleanBranchName } from '../../lib/branch'

export default function FeeStudentList({
  loading, filterBranch, displayUnpaid, displayPaid,
  selected, onToggleSelect, onSelectAllUnpaid, getPayment,
  onRecordClick, onPrint, onOpenReceipt, onSendTelegram, sendingId,
}) {
  if (loading) return <CenteredSpinner padding={48} />

  if (displayUnpaid.length === 0 && displayPaid.length === 0) {
    return (
      <div className="text-center text-muted text-[13px] p-12">
        {filterBranch ? 'No students found' : 'Select a branch to view students'}
      </div>
    )
  }

  return (
    <>
      {displayUnpaid.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] text-muted uppercase tracking-wider">
              Unpaid — {displayUnpaid.length}
            </div>
            <button onClick={onSelectAllUnpaid}
              className="text-[11px] text-present bg-transparent border-0 cursor-pointer font-medium">
              {displayUnpaid.every(s => selected.includes(s.id)) ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
            {displayUnpaid.map(s => {
              const isSelected = selected.includes(s.id)
              return (
              <div key={s.id}
                className={`rounded-xl px-3.5 py-3 flex items-center gap-3 border ${
                  isSelected ? 'border-present bg-present-bg' : 'border-border bg-surface'
                }`}>
                <div onClick={() => onToggleSelect(s.id)}
                  className={`w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center cursor-pointer flex-shrink-0 ${
                    isSelected ? 'border-present bg-present' : 'border-border bg-transparent'
                  }`}>
                  {isSelected && <span className="text-white text-[11px] font-bold">✓</span>}
                </div>
                <div className="w-8 h-8 rounded-full bg-absent-bg flex items-center justify-center text-[13px] font-medium text-absent flex-shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-ink overflow-hidden text-ellipsis whitespace-nowrap">{s.name}</div>
                  <div className="text-[11px] text-muted mt-0.5">{s.student_no} · {cleanBranchName(s.branches?.name)}</div>
                </div>
                <div className="text-sm font-medium text-absent flex-shrink-0">
                  RM {parseFloat(s.monthly_fee || 0).toFixed(0)}
                </div>
                <button onClick={() => onRecordClick(s)}
                  className="bg-present text-white border-0 rounded-lg px-3 py-1.5 text-[11px] font-medium cursor-pointer flex-shrink-0">
                  Record
                </button>
              </div>
              )
            })}
          </div>
        </div>
      )}

      {displayPaid.length > 0 && (
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-2">
            Paid — {displayPaid.length}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
            {displayPaid.map(s => {
              const p = getPayment(s.id)
              return (
                <div key={s.id} className="bg-surface border border-border rounded-xl px-3.5 py-3 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-md bg-present flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[11px] font-bold">✓</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-present-bg flex items-center justify-center text-[13px] font-medium text-present flex-shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-ink overflow-hidden text-ellipsis whitespace-nowrap">{s.name}</div>
                    <div className="text-[11px] text-muted mt-0.5">
                      {p?.receipt_no} · {p?.payment_method}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-present flex-shrink-0">
                    RM {parseFloat(p?.amount || 0).toFixed(0)}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => onPrint(p)}
                      className="bg-page border border-border rounded-lg px-2 py-1.5 text-[11px] text-ink cursor-pointer">
                      🖨️
                    </button>
                    <button onClick={() => onOpenReceipt(p)}
                      className="bg-page border border-border rounded-lg px-2 py-1.5 text-[11px] text-ink cursor-pointer">
                      🔗
                    </button>
                    <button onClick={() => onSendTelegram(p)} disabled={sendingId === p?.id}
                      className="bg-holiday-bg border border-holiday rounded-lg px-2 py-1.5 text-[11px] text-holiday cursor-pointer disabled:opacity-60">
                      {sendingId === p?.id ? '...' : '📱'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
