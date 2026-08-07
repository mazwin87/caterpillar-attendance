import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok, fail, makeQueryBuilder } from '../helpers/mockSupabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from:      vi.fn(),
    rpc:       vi.fn(),
    functions: { invoke: vi.fn() },
  },
}))

vi.mock('../../lib/utils/date', () => ({
  getMYT: () => '2026-08-06',
}))

import { supabase } from '../../lib/supabase'
import {
  recordScan, verifyStudentBranch, getTodayCounts,
  getStudentsForBranch, upsertAttendance, getScannerBranches,
} from '../../lib/services/attendance.service'

beforeEach(() => vi.clearAllMocks())

describe('recordScan', () => {
  it('returns rpc result on success', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: { success: true, status: 'PRESENT' }, error: null })
    const result = await recordScan('student-1')
    expect(result).toEqual({ success: true, status: 'PRESENT' })
    expect(supabase.rpc).toHaveBeenCalledWith('record_scan', { p_student_id: 'student-1' })
  })

  it('returns error shape on rpc failure', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const result = await recordScan('bad-id')
    expect(result).toEqual({ success: false, error: 'Not found' })
  })
})

describe('verifyStudentBranch', () => {
  it('returns true when branch matches', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok({ branch_id: 'branch-1' }))
    const result = await verifyStudentBranch('student-1', 'branch-1')
    expect(result).toBe(true)
  })

  it('returns false when branch does not match', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok({ branch_id: 'branch-2' }))
    const result = await verifyStudentBranch('student-1', 'branch-1')
    expect(result).toBe(false)
  })

  it('returns false when student not found', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    const result = await verifyStudentBranch('missing', 'branch-1')
    expect(result).toBe(false)
  })
})

describe('getTodayCounts', () => {
  const attendanceRows = [
    { student_id: 's1', status: 'PRESENT', students: { branch_id: 'b1' } },
    { student_id: 's2', status: 'LATE',    students: { branch_id: 'b1' } },
    { student_id: 's3', status: 'PRESENT', students: { branch_id: 'b2' } },
  ]

  it('returns counts for all branches when branchId is null', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(attendanceRows))
    const result = await getTodayCounts(null)
    expect(result.present).toBe(2)
    expect(result.late).toBe(1)
    expect(result.todayMap).toEqual({ s1: 'PRESENT', s2: 'LATE', s3: 'PRESENT' })
  })

  it('filters counts when branchId is provided', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(attendanceRows))
    const result = await getTodayCounts('b1')
    expect(result.present).toBe(1)
    expect(result.late).toBe(1)
    // todayMap still includes all students (for highlighting)
    expect(Object.keys(result.todayMap)).toHaveLength(3)
  })

  it('returns zeros when no data', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    const result = await getTodayCounts(null)
    expect(result).toEqual({ present: 0, late: 0, todayMap: {} })
  })
})

describe('getStudentsForBranch', () => {
  it('returns all active students when no branchId', async () => {
    const students = [{ id: 's1', name: 'Ali' }]
    vi.mocked(supabase.from).mockReturnValue(ok(students))
    const result = await getStudentsForBranch(null)
    expect(result).toEqual(students)
  })

  it('returns empty array when query returns null', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    const result = await getStudentsForBranch('b1')
    expect(result).toEqual([])
  })
})

describe('upsertAttendance', () => {
  const student = { id: 's1', branch_id: 'b1' }

  it('updates existing record when one already exists today', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeQueryBuilder({ data: { id: 'att-1' }, error: null })) // maybeSingle select
      .mockReturnValueOnce(makeQueryBuilder({ data: null, error: null }))             // update
    await upsertAttendance(student, 'LATE')
    expect(supabase.from).toHaveBeenCalledTimes(2)
  })

  it('inserts a new record when none exists today', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeQueryBuilder({ data: null, error: null }))  // maybeSingle returns null
      .mockReturnValueOnce(makeQueryBuilder({ data: null, error: null }))  // insert
    await upsertAttendance(student, 'PRESENT')
    expect(supabase.from).toHaveBeenCalledTimes(2)
  })

  it('throws when select fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeQueryBuilder({ data: null, error: { message: 'DB error' } })
    )
    await expect(upsertAttendance(student, 'PRESENT')).rejects.toThrow('Lookup failed: DB error')
  })
})

describe('getScannerBranches', () => {
  it('returns branches list', async () => {
    const branches = [{ id: 'b1', name: 'KL Traders', slug: 'KLTS' }]
    vi.mocked(supabase.from).mockReturnValue(ok(branches))
    const result = await getScannerBranches()
    expect(result).toEqual(branches)
  })

  it('returns empty array when query returns null', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    expect(await getScannerBranches()).toEqual([])
  })
})
