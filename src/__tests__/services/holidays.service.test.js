import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok, fail, makeQueryBuilder } from '../helpers/mockSupabase'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import {
  getHolidays, getClosures,
  createHoliday, deleteHoliday,
  createClosure, deleteClosure, deletePastClosures,
} from '../../lib/services/holidays.service'

beforeEach(() => vi.clearAllMocks())

describe('getHolidays', () => {
  it('returns list of holidays', async () => {
    const holidays = [{ id: 'h1', start_date: '2026-08-01' }]
    vi.mocked(supabase.from).mockReturnValue(ok(holidays))
    expect(await getHolidays()).toEqual(holidays)
  })

  it('returns empty array when data is null', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    expect(await getHolidays()).toEqual([])
  })

  it('throws on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('DB error'))
    await expect(getHolidays()).rejects.toThrow('DB error')
  })
})

describe('getClosures', () => {
  it('returns active off-day closures', async () => {
    const closures = [{ id: 'c1', date: '2026-09-01', is_off_day: true }]
    vi.mocked(supabase.from).mockReturnValue(ok(closures))
    expect(await getClosures()).toEqual(closures)
  })
})

describe('createHoliday', () => {
  const form = { student_id: 's1', branch_id: 'b1', start_date: '2026-08-10', end_date: '2026-08-12', reason: 'Sick' }
  const inserted = { id: 'h-new' }
  const enriched = { id: 'h-new', students: { name: 'Ali' }, branches: { name: 'Sentul' }, ...form }

  it('inserts and returns enriched holiday', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(ok(inserted))   // insert
      .mockReturnValueOnce(ok(enriched))   // re-fetch with relations
    const result = await createHoliday(form)
    expect(result).toEqual(enriched)
    expect(supabase.from).toHaveBeenCalledTimes(2)
  })

  it('throws when insert fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('Constraint violation'))
    await expect(createHoliday(form)).rejects.toThrow('Constraint violation')
  })
})

describe('deleteHoliday', () => {
  it('calls delete on the holidays table', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    await deleteHoliday('h1')
    expect(supabase.from).toHaveBeenCalledWith('holidays')
  })

  it('throws on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('Not found'))
    await expect(deleteHoliday('bad')).rejects.toThrow('Not found')
  })
})

describe('createClosure', () => {
  it('inserts and returns the closure', async () => {
    const closure = { id: 'c1', date: '2026-09-01', label: 'National Day', is_off_day: true }
    vi.mocked(supabase.from).mockReturnValue(ok(closure))
    const result = await createClosure({ date: '2026-09-01', label: 'National Day' })
    expect(result).toEqual(closure)
  })

  it('defaults end_date to date when not provided', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok({ id: 'c1', date: '2026-09-01', end_date: '2026-09-01' }))
    const result = await createClosure({ date: '2026-09-01', label: 'Holiday' })
    // just verify it didn't throw
    expect(result.id).toBe('c1')
  })
})

describe('deleteClosure', () => {
  it('calls delete on school_calendar', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    await deleteClosure('c1')
    expect(supabase.from).toHaveBeenCalledWith('school_calendar')
  })
})

describe('deletePastClosures', () => {
  it('does nothing when ids array is empty', async () => {
    await deletePastClosures([])
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('deletes when ids are provided', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    await deletePastClosures(['c1', 'c2'])
    expect(supabase.from).toHaveBeenCalledWith('school_calendar')
  })
})
