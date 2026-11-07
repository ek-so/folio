import { describe, it, expect } from 'vitest'
import { parseRecurrence, formatRecurrence, occursOn } from './recurrence.js'

const rule = text => parseRecurrence(text)
const days = (text, start, keys) => keys.filter(k => occursOn(rule(text), start, k))

describe('recurrence', () => {
  it('reads and writes a type', () => {
    expect(rule('one-time')).toEqual({ kind: 'one-time' })
    expect(rule('recurring')).toEqual({ kind: 'unset' })
    expect(rule('')).toBeNull()
    expect(rule('regular')).toBeNull()
    expect(rule('Weekly')).toEqual({ kind: 'repeat', every: 1, unit: 'week', weekdays: [], until: null })
    expect(rule('every 2 weeks on Wed, Mon until 31 Dec 2026')).toEqual({ kind: 'repeat', every: 2, unit: 'week', weekdays: [1, 3], until: '2026-12-31' })
    expect(rule('every 3 days')).toMatchObject({ every: 3, unit: 'day' })
    expect(rule('monthly on Mon')).toBeNull() // weekdays are for weeks only
    expect(rule('every 0 days')).toBeNull()
    for (const text of ['one-time', 'recurring', 'daily', 'monthly', 'every 2 weeks on Mon, Wed', 'yearly until 1 Jan 2030', 'every 3 months'])
      expect(formatRecurrence(rule(text))).toBe(text)
    expect(formatRecurrence({ kind: 'repeat', every: 1, unit: 'week', weekdays: [0, 1], until: null })).toBe('weekly on Mon, Sun')
  })

  it('finds the days a card happens on', () => {
    const nov = Array.from({ length: 30 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`)
    expect(days('every 3 days', '2026-11-05', nov)).toEqual(['2026-11-05', '2026-11-08', '2026-11-11', '2026-11-14', '2026-11-17', '2026-11-20', '2026-11-23', '2026-11-26', '2026-11-29'])
    expect(days('weekly', '2026-11-04', nov)).toEqual(['2026-11-04', '2026-11-11', '2026-11-18', '2026-11-25']) // Wednesdays
    expect(days('every 2 weeks on Mon, Fri', '2026-11-04', nov)).toEqual(['2026-11-04', '2026-11-06', '2026-11-16', '2026-11-20', '2026-11-30']) // its date, then the weekdays
    expect(days('daily until 3 Nov 2026', '2026-11-01', nov)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03'])
    expect(days('monthly', '2026-01-31', ['2026-02-27', '2026-02-28', '2026-03-31', '2026-04-30'])).toEqual(['2026-02-28', '2026-03-31', '2026-04-30'])
    expect(days('every 2 months', '2026-01-15', ['2026-02-15', '2026-03-15', '2026-05-15'])).toEqual(['2026-03-15', '2026-05-15'])
    expect(days('yearly', '2024-02-29', ['2025-02-28', '2026-03-01', '2028-02-29'])).toEqual(['2025-02-28', '2028-02-29'])
    expect(days('daily', '2026-11-10', ['2026-11-09'])).toEqual([])
  })
})
