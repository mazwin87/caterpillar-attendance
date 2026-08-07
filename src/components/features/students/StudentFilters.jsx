import { AGE_GROUPS, AGE_GROUP_LABELS } from '../../../lib/constants/ageGroups'

export default function StudentFilters({
  branches, filterBranch, setFilterBranch,
  filterGroup, setFilterGroup,
  filterTelegram, setFilterTelegram,
  filterAttendance, setFilterAttendance,
}) {
  const hasActive = filterGroup.length > 0 || filterTelegram || filterAttendance || filterBranch

  function clearAll() {
    setFilterBranch('')
    setFilterGroup([])
    setFilterTelegram('')
    setFilterAttendance('')
  }

  return (
    <div style={{ background: 'var(--bg)', borderRadius: 12, border: '0.5px solid var(--border)', overflow: 'hidden' }}>

      {/* Age group */}
      <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Age group</div>
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
          {['', ...AGE_GROUPS].map(g => {
            const isActive = g === '' ? filterGroup.length === 0 : filterGroup.includes(g)
            return (
              <button key={g}
                onClick={() => {
                  if (g === '') setFilterGroup([])
                  else setFilterGroup(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
                }}
                style={{
                  background:   isActive ? '#4caf87' : 'var(--surface)',
                  color:        isActive ? '#fff' : 'var(--muted)',
                  border:       `0.5px solid ${isActive ? '#4caf87' : 'var(--border)'}`,
                  borderRadius: 20, padding: '4px 12px', fontSize: 11, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                {g ? AGE_GROUP_LABELS[g] : 'All'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Telegram + Attendance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ padding: '10px 14px', borderRight: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Telegram link</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { val: '',          label: 'All' },
              { val: 'linked',    label: '● Linked' },
              { val: 'notlinked', label: '○ Unlinked' },
            ].map(opt => (
              <button key={opt.val} onClick={() => setFilterTelegram(opt.val)}
                style={{
                  background: filterTelegram === opt.val ? '#4caf87' : 'var(--surface)',
                  color:      filterTelegram === opt.val ? '#fff' : 'var(--muted)',
                  border:     `0.5px solid ${filterTelegram === opt.val ? '#4caf87' : 'var(--border)'}`,
                  borderRadius: 8, padding: '5px 8px', fontSize: 11, cursor: 'pointer', textAlign: 'left',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Attendance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { val: '',        label: 'All',        color: null },
              { val: 'PRESENT', label: '✓ Present',  color: '#4caf87' },
              { val: 'LATE',    label: '⏰ Late',    color: '#f0a500' },
              { val: 'ABSENT',  label: '✗ Absent',   color: 'var(--absent)' },
              { val: 'HOLIDAY', label: '🏖 Holiday',  color: 'var(--holiday)' },
            ].map(opt => (
              <button key={opt.val} onClick={() => setFilterAttendance(opt.val)}
                style={{
                  background: filterAttendance === opt.val ? (opt.color || '#4caf87') : 'var(--surface)',
                  color:      filterAttendance === opt.val ? '#fff' : 'var(--muted)',
                  border:     `0.5px solid ${filterAttendance === opt.val ? (opt.color || '#4caf87') : 'var(--border)'}`,
                  borderRadius: 8, padding: '5px 8px', fontSize: 11, cursor: 'pointer', textAlign: 'left',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active filter chips + clear */}
      {hasActive && (
        <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#edf7f2' }}>
          <div style={{ fontSize: 11, color: '#4caf87', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              filterBranch && branches.find(b => b.id === filterBranch)?.slug,
              ...filterGroup.map(g => AGE_GROUP_LABELS[g]),
              filterTelegram === 'linked'    && 'Linked',
              filterTelegram === 'notlinked' && 'Unlinked',
              filterAttendance && filterAttendance.charAt(0) + filterAttendance.slice(1).toLowerCase(),
            ].filter(Boolean).map((f, i) => (
              <span key={i} style={{ background: '#4caf87', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 10 }}>
                {f}
              </span>
            ))}
          </div>
          <button onClick={clearAll}
            style={{ fontSize: 11, color: '#4caf87', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}>
            Clear all ×
          </button>
        </div>
      )}
    </div>
  )
}
