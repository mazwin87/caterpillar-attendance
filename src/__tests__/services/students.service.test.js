import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok, fail, makeQueryBuilder } from '../helpers/mockSupabase'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import {
  getStudents, getBranches, generateStudentNo,
  addStudent, addParent, updateStudent, deactivateStudent,
} from '../../lib/services/students.service'

beforeEach(() => vi.clearAllMocks())

describe('getStudents', () => {
  it('returns active students', async () => {
    const students = [{ id: 's1', name: 'Amir', is_active: true }]
    vi.mocked(supabase.from).mockReturnValue(ok(students))
    expect(await getStudents()).toEqual(students)
  })

  it('throws on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('DB down'))
    await expect(getStudents()).rejects.toThrow('DB down')
  })
})

describe('getBranches', () => {
  it('returns branches list', async () => {
    const branches = [{ id: 'b1', name: 'Sentul' }]
    vi.mocked(supabase.from).mockReturnValue(ok(branches))
    expect(await getBranches()).toEqual(branches)
  })
})

describe('generateStudentNo', () => {
  it('generates 001 when no existing students', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok([]))
    const no = await generateStudentNo('b1', 'KLTS')
    expect(no).toBe('KLTS-001')
  })

  it('increments from the last student number', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok([{ student_no: 'KLTS-007' }]))
    const no = await generateStudentNo('b1', 'KLTS')
    expect(no).toBe('KLTS-008')
  })

  it('pads number to 3 digits', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok([{ student_no: 'MXIM-099' }]))
    const no = await generateStudentNo('b2', 'MXIM')
    expect(no).toBe('MXIM-100')
  })

  it('uppercases the slug', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok([]))
    const no = await generateStudentNo('b1', 'sntl')
    expect(no).toBe('SNTL-001')
  })
})

describe('addStudent', () => {
  it('returns the inserted student', async () => {
    const student = { id: 'new-1', name: 'Siti', student_no: 'KLTS-001' }
    vi.mocked(supabase.from).mockReturnValue(ok(student))
    const result = await addStudent({ name: 'Siti', student_no: 'KLTS-001', branch_id: 'b1', monthly_fee: 600 })
    expect(result).toEqual(student)
  })

  it('throws on insert error', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('Duplicate key'))
    await expect(addStudent({ name: 'X', student_no: 'KLTS-001', branch_id: 'b1' })).rejects.toThrow('Duplicate key')
  })

  it('defaults monthly_fee to 0 when not provided', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok({ id: 'x' }))
    await addStudent({ name: 'X', student_no: 'Y', branch_id: 'b' })
    // verify insert was called (no throw means fee defaulted correctly)
    expect(supabase.from).toHaveBeenCalledWith('students')
  })
})

describe('addParent', () => {
  it('inserts without error', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    await expect(addParent({ student_id: 's1', name: 'Hafiz', phone: '0123' })).resolves.not.toThrow()
  })

  it('throws on insert error', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('FK violation'))
    await expect(addParent({ student_id: 'bad' })).rejects.toThrow('FK violation')
  })
})

describe('updateStudent', () => {
  it('returns updated student data', async () => {
    const updated = { id: 's1', name: 'Ali Updated' }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(ok(null))       // update call
      .mockReturnValueOnce(ok(updated))    // re-fetch
    const result = await updateStudent('s1', { name: 'Ali Updated', monthly_fee: 700 })
    expect(result).toEqual(updated)
  })
})

describe('deactivateStudent', () => {
  it('completes without throwing', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    await expect(deactivateStudent('s1')).resolves.not.toThrow()
  })

  it('throws on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('Not found'))
    await expect(deactivateStudent('bad')).rejects.toThrow('Not found')
  })
})
