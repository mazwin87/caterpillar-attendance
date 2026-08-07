import { Select, Button } from '../../ui'
import { MONTHS } from '../../../lib/constants/months'

export default function MonthSelector({ selectedMonths, year, onToggleMonth, onSelectAll, onYearChange }) {
  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
          Select months
          {selectedMonths.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--present-bg)', color: 'var(--present)', padding: '2px 8px', borderRadius: 10 }}>
              {selectedMonths.length} selected
            </span>
          )}
        </div>
        <Button variant="ghost" onClick={onSelectAll} style={{ fontSize: 11, color: 'var(--present)', padding: 0, fontWeight: 500 }}>
          {selectedMonths.length === 12 ? 'Deselect all' : 'Select all'}
        </Button>
      </div>

      <Select
        value={year}
        onChange={e => onYearChange(parseInt(e.target.value))}
        style={{ marginBottom: 12 }}
      >
        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
      </Select>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {MONTHS.map(m => {
          const isSelected = selectedMonths.includes(m)
          return (
            <button
              key={m}
              type="button"
              onClick={() => onToggleMonth(m)}
              style={{
                padding: '8px 4px', borderRadius: 8, fontSize: 12,
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                background:  isSelected ? 'var(--present)' : 'var(--bg)',
                color:       isSelected ? '#fff' : 'var(--muted)',
                border:      `0.5px solid ${isSelected ? 'var(--present)' : 'var(--border)'}`,
                fontWeight:  isSelected ? 500 : 400,
              }}
            >
              {m.substring(0, 3)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
