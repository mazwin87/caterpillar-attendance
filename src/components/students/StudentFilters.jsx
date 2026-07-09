import { AGE_GROUPS, AGE_GROUP_LABELS, STATUS_CLASSES } from '../../lib/constants'

const inputClass = "w-full bg-page border border-border rounded-[10px] px-3.5 py-2.5 text-sm text-ink outline-none"

const pillButton = (selected) =>
  `px-3 py-1 rounded-full text-[11px] cursor-pointer whitespace-nowrap flex-shrink-0 border ${
    selected ? 'bg-primary text-white border-primary' : 'bg-surface text-muted border-border'
  }`

const rowButton = (selected, activeClasses) =>
  `px-2 py-1.5 rounded-lg text-[11px] cursor-pointer text-left border ${
    selected ? `${activeClasses} text-white` : 'bg-surface text-muted border-border'
  }`

export default function StudentFilters({
  filteredCount, totalCount, onOpenAdd, onOpenPrint,
  search, onSearchChange,
  branches, filterBranch, onFilterBranchChange,
  filterGroup, onFilterGroupChange,
  filterTelegram, onFilterTelegramChange,
  filterAttendance, onFilterAttendanceChange,
  onClearFilters,
}) {
  const hasActiveFilters = filterGroup.length > 0 || filterTelegram || filterAttendance || filterBranch

  const attendanceOptions = [
    { val: '',        label: 'All',       activeBg: 'bg-primary border-primary' },
    { val: 'PRESENT', label: '✓ Present', activeBg: `${STATUS_CLASSES.PRESENT.dot} border-present` },
    { val: 'LATE',    label: '⏰ Late',   activeBg: `${STATUS_CLASSES.LATE.dot} border-late` },
    { val: 'ABSENT',  label: '✗ Absent',  activeBg: `${STATUS_CLASSES.ABSENT.dot} border-absent` },
    { val: 'HOLIDAY', label: '🏖 Holiday', activeBg: `${STATUS_CLASSES.HOLIDAY.dot} border-holiday` },
  ]

  return (
    <div className="pt-[52px] lg:pt-8 bg-surface border-b border-border pb-4 px-5">
     <div className="lg:max-w-5xl lg:mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[22px] font-medium text-ink">Students</div>
          <div className="text-xs text-muted mt-0.5">{filteredCount} of {totalCount} students</div>
        </div>
        <div className="flex gap-2">
          <button onClick={onOpenPrint}
            className="bg-page border border-border rounded-full px-3.5 py-2 text-[13px] text-muted cursor-pointer flex items-center gap-1.5">
            🖨️ Print QR
          </button>
          <button onClick={e => { e.stopPropagation(); onOpenAdd() }}
            className="bg-present text-white border-0 rounded-full px-4 py-2 text-[13px] font-medium cursor-pointer">
            + Add
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <input value={search} onChange={e => onSearchChange(e.target.value)}
          placeholder="Search name or ID..."
          className={`flex-1 ${inputClass}`} />
        <select value={filterBranch} onChange={e => onFilterBranchChange(e.target.value)}
          className="bg-page border border-border rounded-[10px] px-3 py-2.5 text-[13px] text-ink outline-none flex-shrink-0">
          <option value="">All branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.slug}</option>)}
        </select>
      </div>

      <div className="bg-page rounded-xl border border-border overflow-hidden">

        <div className="px-3.5 py-2.5 border-b border-border">
          <div className="text-[11px] text-muted mb-2">Age group</div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {['', ...AGE_GROUPS].map(g => {
              const isActive = g === '' ? filterGroup.length === 0 : filterGroup.includes(g)
              return (
                <button key={g}
                  onClick={() => {
                    if (g === '') onFilterGroupChange([])
                    else onFilterGroupChange(filterGroup.includes(g) ? filterGroup.filter(x => x !== g) : [...filterGroup, g])
                  }}
                  className={pillButton(isActive)}>
                  {g ? AGE_GROUP_LABELS[g] : 'All'}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-border">
          <div className="px-3.5 py-2.5 border-r border-border">
            <div className="text-[11px] text-muted mb-2">Telegram link</div>
            <div className="flex flex-col gap-1">
              {[
                { val: '',          label: 'All' },
                { val: 'linked',    label: '● Linked' },
                { val: 'notlinked', label: '○ Unlinked' },
              ].map(opt => (
                <button key={opt.val} onClick={() => onFilterTelegramChange(opt.val)}
                  className={rowButton(filterTelegram === opt.val, 'bg-primary border-primary')}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-3.5 py-2.5">
            <div className="text-[11px] text-muted mb-2">Attendance</div>
            <div className="flex flex-col gap-1">
              {attendanceOptions.map(opt => (
                <button key={opt.val} onClick={() => onFilterAttendanceChange(opt.val)}
                  className={rowButton(filterAttendance === opt.val, opt.activeBg)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="px-3.5 py-2 flex items-center justify-between bg-present-bg">
            <div className="text-[11px] text-primary flex gap-1 flex-wrap">
              {[
                filterBranch && branches.find(b => b.id === filterBranch)?.slug,
                ...filterGroup.map(g => AGE_GROUP_LABELS[g]),
                filterTelegram === 'linked'    && 'Linked',
                filterTelegram === 'notlinked' && 'Unlinked',
                filterAttendance && filterAttendance.charAt(0) + filterAttendance.slice(1).toLowerCase(),
              ].filter(Boolean).map((f, i) => (
                <span key={i} className="bg-primary text-white rounded-full px-2 py-0.5 text-[10px]">
                  {f}
                </span>
              ))}
            </div>
            <button onClick={onClearFilters}
              className="text-[11px] text-primary bg-transparent border-0 cursor-pointer font-medium whitespace-nowrap">
              Clear all ×
            </button>
          </div>
        )}
      </div>
     </div>
    </div>
  )
}
