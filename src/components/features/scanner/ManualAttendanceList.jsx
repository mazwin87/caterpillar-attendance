import { useState } from 'react'
import { Input, EmptyState } from '../../ui'
import { shortBranchName } from '../../../lib/constants/branches'

export default function ManualAttendanceList({ students, todayAttendance, marking, onMarkPresent, onMarkLate, onMarkAbsent }) {
  const [search, setSearch] = useState('')

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_no.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div style={{ padding: '8px 14px 8px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' }}>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or ID..."
          style={{ padding: '10px 14px' }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', paddingBottom: 'calc(var(--navbar-height) + 70px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0 ? (
          <EmptyState>No students found</EmptyState>
        ) : filtered.map(s => {
          const status    = todayAttendance[s.id]
          const isPresent = status === 'PRESENT'
          const isLate    = status === 'LATE'
          const isHoliday = status === 'HOLIDAY'
          const isAbsent  = status === 'ABSENT'
          const isLoading = marking === s.id || marking === s.id + '_late' || marking === s.id + '_absent'

          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 12,
              background: isPresent ? '#edf7f2' : isLate ? '#fffbe6' : isAbsent ? 'var(--absent-bg)' : isHoliday ? 'var(--holiday-bg)' : 'var(--surface)',
              border: `0.5px solid ${isPresent ? '#4caf87' : isLate ? '#f0a500' : isAbsent ? 'var(--absent)' : isHoliday ? 'var(--holiday)' : 'var(--border)'}`,
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: isPresent ? '#4caf87' : isLate ? '#f0a500' : isHoliday ? 'var(--holiday)' : 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isPresent || isLate ? 14 : 13, fontWeight: 500, color: '#fff',
              }}>
                {isPresent ? '✓' : isLate ? '⏰' : isHoliday ? '🏖' : s.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.student_no} · {shortBranchName(s.branches?.name)}</div>
              </div>
              {isHoliday ? (
                <span style={{ fontSize: 10, color: 'var(--holiday)', padding: '3px 8px', background: 'var(--holiday-bg)', borderRadius: 6, border: '0.5px solid var(--holiday)' }}>Holiday</span>
              ) : isPresent ? (
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  <button onClick={() => onMarkLate(s)} disabled={!!marking}
                    style={{ background: '#d4ede2', color: '#2d7a4f', border: '0.5px solid #4caf87', borderRadius: 8, padding: '5px 11px', fontSize: 11, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                    {marking === s.id + '_late' ? '...' : '✓ Present'}
                  </button>
                  <button onClick={() => onMarkAbsent(s)} disabled={!!marking}
                    style={{ background: 'var(--absent-bg)', color: 'var(--absent)', border: '0.5px solid var(--absent)', borderRadius: 8, padding: '5px 8px', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                    {marking === s.id + '_absent' ? '...' : 'Absent'}
                  </button>
                </div>
              ) : isLate ? (
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  <button onClick={() => onMarkPresent(s)} disabled={!!marking}
                    style={{ background: '#fff0b3', color: '#8a6000', border: '0.5px solid #e8c840', borderRadius: 8, padding: '5px 11px', fontSize: 11, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                    {marking === s.id ? '...' : '⏰ Late'}
                  </button>
                  <button onClick={() => onMarkAbsent(s)} disabled={!!marking}
                    style={{ background: 'var(--absent-bg)', color: 'var(--absent)', border: '0.5px solid var(--absent)', borderRadius: 8, padding: '5px 8px', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                    {marking === s.id + '_absent' ? '...' : 'Absent'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  <button onClick={() => onMarkPresent(s)} disabled={!!marking}
                    style={{ background: '#4caf87', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 11, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                    {marking === s.id ? '...' : 'In'}
                  </button>
                  <button onClick={() => onMarkLate(s)} disabled={!!marking}
                    style={{ background: '#fff8e0', color: '#8a6000', border: '0.5px solid #e8c840', borderRadius: 7, padding: '6px 11px', fontSize: 11, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                    {marking === s.id + '_late' ? '...' : 'Late'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
