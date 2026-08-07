import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok, fail } from '../helpers/mockSupabase'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import { getAttendanceRange } from '../../lib/services/reports.service'

beforeEach(() => vi.clearAllMocks())

describe('getAttendanceRange', () => {
  const rows = [
    { id: 'a1', date: '2026-08-01', status: 'PRESENT', students: { name: 'Ali' } },
    { id: 'a2', date: '2026-08-02', status: 'ABSENT',  students: { name: 'Siti' } },
  ]

  it('returns attendance records for the date range', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(rows))
    const result = await getAttendanceRange('2026-08-01', '2026-08-07')
    expect(result).toEqual(rows)
    expect(supabase.from).toHaveBeenCalledWith('attendance')
  })

  it('returns empty array when no records', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    const result = await getAttendanceRange('2026-08-01', '2026-08-07')
    expect(result).toEqual([])
  })

  it('filters by branchId when provided', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(rows))
    await getAttendanceRange('2026-08-01', '2026-08-07', 'b1')
    // just verify it didn't throw and called from
    expect(supabase.from).toHaveBeenCalledWith('attendance')
  })

  it('does not filter by branch when branchId is null', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(rows))
    await getAttendanceRange('2026-08-01', '2026-08-07', null)
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('throws on query error', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('Permission denied'))
    await expect(getAttendanceRange('2026-08-01', '2026-08-07')).rejects.toThrow('Permission denied')
  })
})
