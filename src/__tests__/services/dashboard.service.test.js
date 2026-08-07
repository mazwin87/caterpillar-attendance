import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ok, fail, makeQueryBuilder } from '../helpers/mockSupabase'

vi.mock('../../lib/supabase', () => ({
  supabase:        { from: vi.fn(), rpc: vi.fn() },
  getDailySummary: vi.fn(),
}))

vi.mock('../../lib/constants/ageGroups', () => ({
  getAgeGroup: vi.fn(),
}))

import { supabase } from '../../lib/supabase'
import { getAgeGroup } from '../../lib/constants/ageGroups'
import {
  getDrilldown, overrideStatus, getTodayEvent,
  markAbsentForEvent, markAllAbsent,
} from '../../lib/services/dashboard.service'

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.unstubAllGlobals())

// ─── getDrilldown ────────────────────────────────────────────────────────────

describe('getDrilldown', () => {
  const records = [
    { id: 'a1', status: 'ABSENT', students: { name: 'Ali', student_no: 'KLTS-001', branches: { name: 'KL Traders' } } },
  ]

  it('filters by session.branch_id for a teacher session (single DB call)', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(records))
    const session = { role: 'teacher', branch_id: 'b1' }
    const result = await getDrilldown('ABSENT', null, session)
    expect(result).toEqual(records)
    expect(supabase.from).toHaveBeenCalledTimes(1)
    expect(supabase.from).toHaveBeenCalledWith('attendance')
  })

  it('resolves branch by name for an admin session with branchName (two DB calls)', async () => {
    // getDrilldown calls from('attendance') first to build the query, THEN
    // awaits from('branches').single() to get the branch id — so attendance is call 1.
    vi.mocked(supabase.from)
      .mockReturnValueOnce(ok(records))       // attendance (builder created 1st)
      .mockReturnValueOnce(ok({ id: 'b1' })) // branches lookup (awaited 2nd)
    const session = { role: 'admin' }
    const result = await getDrilldown('ABSENT', 'Caterpillar Playtime KL Traders', session)
    expect(result).toEqual(records)
    expect(supabase.from).toHaveBeenCalledTimes(2)
    expect(supabase.from).toHaveBeenNthCalledWith(1, 'attendance')
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'branches')
  })

  it('skips branch lookup for admin with no branchName (single DB call)', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(records))
    const session = { role: 'admin' }
    const result = await getDrilldown('PRESENT', null, session)
    expect(result).toEqual(records)
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('returns empty array when query has no data', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    expect(await getDrilldown('ABSENT', null, { role: 'admin' })).toEqual([])
  })
})

// ─── overrideStatus ──────────────────────────────────────────────────────────

describe('overrideStatus', () => {
  it('resolves without error on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeQueryBuilder({ data: null, error: null }))
    await expect(overrideStatus('att-1', 'PRESENT')).resolves.toBeUndefined()
    expect(supabase.from).toHaveBeenCalledWith('attendance')
  })

  it('throws with DB error message (covers invalid status → enum rejection from DB)', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeQueryBuilder({ data: null, error: { message: 'invalid input value for enum' } }))
    await expect(overrideStatus('att-1', 'INVALID')).rejects.toThrow('invalid input value for enum')
  })
})

// ─── getTodayEvent ───────────────────────────────────────────────────────────

describe('getTodayEvent', () => {
  it('returns the event when one exists today', async () => {
    const event = { id: 'e1', name: 'Sports Day', date: '2026-08-06', branches: ['b1'], age_groups: ['1year'] }
    vi.mocked(supabase.from).mockReturnValue(ok(event))
    expect(await getTodayEvent()).toEqual(event)
    expect(supabase.from).toHaveBeenCalledWith('events')
  })

  it('returns null when no event exists today', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    expect(await getTodayEvent()).toBeNull()
  })
})

// ─── markAbsentForEvent ──────────────────────────────────────────────────────

describe('markAbsentForEvent', () => {
  const event = { branches: ['b1'], age_groups: ['1year'] }
  const student = { id: 's1', branch_id: 'b1', date_of_birth: '2025-01-01' }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  it('marks eligible unscanned students absent and returns count', async () => {
    vi.mocked(getAgeGroup).mockReturnValue({ label: '1year' })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(ok([student]))  // students query
      .mockReturnValueOnce(ok([]))         // attendance already scanned (none)
      .mockReturnValueOnce(ok(null))       // insert absent row

    const result = await markAbsentForEvent(event)

    expect(result).toEqual({ count: 1 })
    expect(supabase.from).toHaveBeenCalledWith('attendance')
  })

  it('only queries students from event branches — other branches are never touched', async () => {
    vi.mocked(getAgeGroup).mockReturnValue({ label: '1year' })

    // Spy on the students builder's `in()` to capture what branch filter is applied
    const studentsBuilder = makeQueryBuilder({ data: [student], error: null })
    const inSpy = vi.spyOn(studentsBuilder, 'in')

    vi.mocked(supabase.from)
      .mockReturnValueOnce(studentsBuilder)  // students — branch filter captured here
      .mockReturnValueOnce(ok([]))           // attendance already scanned
      .mockReturnValueOnce(ok(null))         // insert

    await markAbsentForEvent(event)

    // Only 'b1' was requested — 'b2' (or any other branch) was never queried
    expect(inSpy).toHaveBeenCalledWith('branch_id', ['b1'])
    expect(inSpy).not.toHaveBeenCalledWith('branch_id', expect.arrayContaining(['b2']))
  })

  it('returns count 0 and skips insert when all eligible students are already scanned', async () => {
    vi.mocked(getAgeGroup).mockReturnValue({ label: '1year' })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(ok([student]))                          // students
      .mockReturnValueOnce(ok([{ student_id: 's1' }]))            // already scanned

    const result = await markAbsentForEvent(event)

    expect(result).toEqual({ count: 0 })
    // insert was never called — only students + attendance-select = 2 from calls
    expect(supabase.from).toHaveBeenCalledTimes(2)
  })

  it('returns count 0 immediately with no fetch call when no students match event age group', async () => {
    vi.mocked(getAgeGroup).mockReturnValue(null)  // student's age is out of range
    vi.mocked(supabase.from).mockReturnValueOnce(ok([student]))

    const result = await markAbsentForEvent(event)

    expect(result).toEqual({ count: 0 })
    // Early return before attendance query or fetch
    expect(supabase.from).toHaveBeenCalledTimes(1)
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

// ─── markAllAbsent ───────────────────────────────────────────────────────────

describe('markAllAbsent', () => {
  it('resolves on success', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })
    await expect(markAllAbsent('caller-1')).resolves.toBeUndefined()
    expect(supabase.rpc).toHaveBeenCalledWith('run_daily_absent_marking', { p_caller_id: 'caller-1' })
  })

  it('delegates entirely to server-side RPC — never writes directly to any table', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })
    await markAllAbsent('caller-1')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('throws when RPC returns an error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'RPC failed' } })
    await expect(markAllAbsent('caller-1')).rejects.toThrow('RPC failed')
  })
})
