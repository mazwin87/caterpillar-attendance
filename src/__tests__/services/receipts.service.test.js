import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok, fail } from '../helpers/mockSupabase'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import { getReceiptById } from '../../lib/services/receipts.service'

beforeEach(() => vi.clearAllMocks())

describe('getReceiptById', () => {
  const payment = {
    id: 'pay-1',
    receipt_no: 'KLTS-2026-001',
    amount: 650,
    month: 'August',
    year: 2026,
    students: { name: 'Amir', student_no: 'KLTS-001', branches: { name: 'KL Traders' } },
  }

  it('returns the payment with student and branch data', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(payment))
    const result = await getReceiptById('pay-1')
    expect(result).toEqual(payment)
    expect(supabase.from).toHaveBeenCalledWith('payments')
  })

  it('throws "Receipt not found" when query returns error', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('Not found'))
    await expect(getReceiptById('bad-id')).rejects.toThrow('Receipt not found')
  })

  it('throws "Receipt not found" when data is null', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    await expect(getReceiptById('bad-id')).rejects.toThrow('Receipt not found')
  })
})
