export default function FeeSummaryBar({ paidCount, unpaidCount, total, filterStatus, onFilterChange }) {
  return (
    <div className="lg:max-w-5xl lg:mx-auto grid grid-cols-3 gap-2 px-4 pt-3">
      <div onClick={() => onFilterChange(filterStatus === 'paid' ? '' : 'paid')}
        className={`rounded-[10px] px-3 py-2.5 text-center cursor-pointer transition-all duration-150 ${
          filterStatus === 'paid' ? 'bg-present' : 'bg-present-bg'
        }`}>
        <div className={`text-xl font-medium ${filterStatus === 'paid' ? 'text-white' : 'text-present'}`}>{paidCount}</div>
        <div className={`text-[10px] uppercase tracking-wide ${filterStatus === 'paid' ? 'text-white/80' : 'text-present'}`}>Paid</div>
      </div>
      <div onClick={() => onFilterChange(filterStatus === 'unpaid' ? '' : 'unpaid')}
        className={`rounded-[10px] px-3 py-2.5 text-center cursor-pointer transition-all duration-150 ${
          filterStatus === 'unpaid' ? 'bg-absent' : 'bg-absent-bg'
        }`}>
        <div className={`text-xl font-medium ${filterStatus === 'unpaid' ? 'text-white' : 'text-absent'}`}>{unpaidCount}</div>
        <div className={`text-[10px] uppercase tracking-wide ${filterStatus === 'unpaid' ? 'text-white/80' : 'text-absent'}`}>Unpaid</div>
      </div>
      <div className="bg-surface border border-border rounded-[10px] px-3 py-2.5 text-center">
        <div className="text-base font-medium text-ink">RM {total.toFixed(0)}</div>
        <div className="text-[10px] text-muted uppercase tracking-wide">Collected</div>
      </div>
    </div>
  )
}
