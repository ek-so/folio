import { describe, it, expect } from 'vitest'
import { findDates, formatDate } from './dates.js'
import { withFixedDates } from './markdown.js'

const now = new Date(2026, 5, 1)
const fixed = (text, before = '') => withFixedDates(text, before, now)

describe('dates', () => {
  it('writes every clear format the same way, day first', () => {
    expect(fixed('2026-10-17')).toBe('17 Oct 2026')
    expect(fixed('2026-10-17T14:30')).toBe('17 Oct 2026, 14:30')
    expect(fixed('17.10.2026 2:30pm')).toBe('17 Oct 2026, 14:30')
    expect(fixed('03/04/2026 at 9am')).toBe('3 Apr 2026, 09:00')
    expect(fixed('17th of October 2026, 12am')).toBe('17 Oct 2026, 00:00')
    expect(fixed('Oct. 17, 2026 14:30')).toBe('17 Oct 2026, 14:30')
    expect(fixed('Due Sept 5.')).toBe('Due 5 Sep 2026.')
    expect(fixed('17 Oct 2026, 14:30')).toBe('17 Oct 2026, 14:30')
  })

  it('leaves what is not a date', () => {
    for (const text of ['2025-02-29', '31.04.2026', '17.10.26', '12/05/95', 'v1.2.34', 'Release 1.2.26 out', '192.168.1.10', '3/4 cup',
      'they march 3 miles', 'page 17 of 20', 'at 14:30', 'tomorrow', '1.2.3.2026', 'see 2026-10-17.md', 'notes/2026-10-17-standup']) {
      expect(fixed(text)).toBe(text)
    }
    expect(findDates('17 Oct 2026 25:00', now)[0].date.hour).toBeUndefined()
  })

  it('never reaches across a line', () => {
    expect(fixed('Payment due 5 Oct\n2500 EUR')).toBe('Payment due 5 Oct 2026\n2500 EUR')
    expect(fixed('Standup 2026-10-17\n10:00 breakfast')).toBe('Standup 17 Oct 2026\n10:00 breakfast')
  })

  it('leaves code, links, HTML and the front matter as typed', () => {
    const text = '---\ndue: 2026-10-17\n---\n`2026-10-17` [2026-10-17](a.md) https://x.com/2026-10-17 <time datetime="2026-10-17">\n\n```\n2026-10-17\n```\n\n    code 2026-10-17\n\n[17.10.2026] ref\n\n[17.10.2026]: http://x\n\n2026-10-17\n'
    expect(fixed(text)).toBe(text.replace(/2026-10-17\n$/, '17 Oct 2026\n'))
  })

  it('rewrites only the dates typed since editing started', () => {
    const before = '| 2025-03-18 | Pay rnet |\n\nCall 2025-03-18\n'
    expect(fixed(before, before)).toBe(before)
    expect(fixed('| 2025-03-18 | Pay rent |\n\nCall 2025-03-18 and 2025-03-18\n', before)).toBe('| 2025-03-18 | Pay rent |\n\nCall 2025-03-18 and 18 Mar 2025\n')
    expect(fixed('- 2025-03-19 standup\n- 2026-10-17\n', '- 2025-03-18 standup\n')).toBe('- 19 Mar 2025 standup\n- 17 Oct 2026\n')
    expect(fixed('Call 2025-03-18\n\nnew 17.10.2026\n', 'Call 2025-03-18\n')).toBe('Call 2025-03-18\n\nnew 17 Oct 2026\n')
  })

  it('formats with or without a time', () => {
    expect(formatDate({ year: 2026, month: 1, day: 5 })).toBe('5 Jan 2026')
    expect(formatDate({ year: 2026, month: 12, day: 31, hour: 7, minute: 5 })).toBe('31 Dec 2026, 07:05')
  })
})
