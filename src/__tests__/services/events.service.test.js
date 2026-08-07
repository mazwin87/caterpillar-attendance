import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok, fail } from '../helpers/mockSupabase'

vi.mock('../../lib/supabase', () => ({
  supabase:    { from: vi.fn() },
  getBranches: vi.fn(),
}))

import { supabase, getBranches } from '../../lib/supabase'
import { getEvents, createEvent, deleteEvent } from '../../lib/services/events.service'

beforeEach(() => vi.clearAllMocks())

describe('getEvents', () => {
  it('returns events ordered by date desc', async () => {
    const events = [{ id: 'e1', name: 'Sports Day', date: '2026-08-10' }]
    vi.mocked(supabase.from).mockReturnValue(ok(events))
    expect(await getEvents()).toEqual(events)
  })

  it('returns empty array when data is null', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    expect(await getEvents()).toEqual([])
  })

  it('throws on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('DB error'))
    await expect(getEvents()).rejects.toThrow('DB error')
  })
})

describe('createEvent', () => {
  const form = {
    name: 'Sports Day',
    date: '2026-08-10',
    branches:   ['b1', 'b2'],
    age_groups: ['1year', '2year'],
  }

  it('returns the created event', async () => {
    const event = { id: 'e-new', ...form }
    vi.mocked(supabase.from).mockReturnValue(ok(event))
    const result = await createEvent(form)
    expect(result).toEqual(event)
  })

  it('throws on insert error', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('Validation failed'))
    await expect(createEvent(form)).rejects.toThrow('Validation failed')
  })
})

describe('deleteEvent', () => {
  it('calls delete on events table', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    await deleteEvent('e1')
    expect(supabase.from).toHaveBeenCalledWith('events')
  })

  it('throws on error', async () => {
    vi.mocked(supabase.from).mockReturnValue(fail('Not found'))
    await expect(deleteEvent('bad')).rejects.toThrow('Not found')
  })
})
