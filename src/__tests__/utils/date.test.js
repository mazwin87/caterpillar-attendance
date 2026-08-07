import { describe, it, expect, vi, afterEach } from 'vitest'
import { getMYT, getMYTDaysAgo } from '../../lib/utils/date'

afterEach(() => vi.useRealTimers())

describe('getMYT', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const result = getMYT()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('uses local time, not UTC', () => {
    // Pin to 2026-03-01 00:30 local (which may be Feb 28 in UTC)
    const local = new Date(2026, 2, 1, 0, 30) // month is 0-indexed
    vi.useFakeTimers()
    vi.setSystemTime(local)
    expect(getMYT()).toBe('2026-03-01')
  })

  it('pads month and day with leading zeros', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5)) // Jan 5
    expect(getMYT()).toBe('2026-01-05')
  })
})

describe('getMYTDaysAgo', () => {
  it('getMYTDaysAgo(0) returns today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 6)) // Aug 6
    expect(getMYTDaysAgo(0)).toBe('2026-08-06')
  })

  it('getMYTDaysAgo(6) returns 6 days before today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 6)) // Aug 6
    expect(getMYTDaysAgo(6)).toBe('2026-07-31')
  })

  it('handles month boundary correctly', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 2)) // Apr 2
    expect(getMYTDaysAgo(3)).toBe('2026-03-30')
  })
})
