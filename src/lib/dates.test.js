import { describe, it, expect } from 'vitest'
import { findDates, formatDate, withFixedDates } from './dates.js'

const now = new Date(2026, 5, 1)
const fixed = text => withFixedDates(text, now)

describe('dates', () => {
  it('writes every clear format the same way, day first', () => {
    expect(fixed('2026-10-17')).toBe('17 Oct 2026')
    expect(fixed('2026-10-17T14:30')).toBe('17 Oct 2026, 14:30')
    expect(fixed('17.10.2026 2:30pm')).toBe('17 Oct 2026, 14:30')
    expect(fixed('03/04/26 at 9am')).toBe('3 Apr 2026, 09:00')
    expect(fixed('17th of October 2026, 12am')).toBe('17 Oct 2026, 00:00')
    expect(fixed('Oct. 17, 2026 14:30')).toBe('17 Oct 2026, 14:30')
    expect(fixed('Due sept 5.')).toBe('Due 5 Sep 2026.')
    expect(fixed('17 Oct 2026, 14:30')).toBe('17 Oct 2026, 14:30')
  })

  it('leaves what is not a date', () => {
    for (const text of ['2025-02-29', '31.04.2026', 'v1.2.34', '192.168.1.10', '3/4 cup', 'I may 5', 'page 17 of 20', 'at 14:30', '17 Oct 2026 25:00', 'tomorrow', '1.2.3.2026']) {
      expect(fixed(text)).toBe(text)
    }
    expect(findDates('17 Oct 2026 25:00', now)[0].date.hour).toBeUndefined()
  })

  it('leaves code, links, URLs, HTML and the front matter as typed', () => {
    const text = '---\ndue: 2026-10-17\n---\n`2026-10-17` [2026-10-17](a.md) https://x.com/2026-10-17 <time datetime="2026-10-17">\n```\n2026-10-17\n```\n2026-10-17\n'
    expect(fixed(text)).toBe(text.replace(/2026-10-17\n$/, '17 Oct 2026\n'))
  })

  it('formats with or without a time', () => {
    expect(formatDate({ year: 2026, month: 1, day: 5 })).toBe('5 Jan 2026')
    expect(formatDate({ year: 2026, month: 12, day: 31, hour: 7, minute: 5 })).toBe('31 Dec 2026, 07:05')
  })
})
