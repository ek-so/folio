import { describe, it, expect } from 'vitest'
import { findDates, formatDate } from './dates.js'
import { withFixedDates, dateSpans, withDate, valueDate } from './markdown.js'

const now = new Date(2026, 5, 1)
const fixed = text => withFixedDates(text, now)

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
      'they march 3 miles', 'page 17 of 20', 'at 14:30', 'tomorrow', 'ratio 3:1', 'v1.10:30', '25:00', '12:5', '1.2.3.2026', 'see 2026-10-17.md', 'notes/2026-10-17-standup']) {
      expect(fixed(text)).toBe(text)
    }
    expect(findDates('17 Oct 2026 25:00', now)[0].date.hour).toBeUndefined()
  })

  it('takes a lowercase month right after its day, not before it', () => {
    expect(fixed('Due 5 oct')).toBe('Due 5 Oct 2026')
    expect(fixed('the 17th of october 2026, 9am')).toBe('the 17 Oct 2026, 09:00')
    expect(fixed('oct 5')).toBe('oct 5')
  })

  it('never reaches across a line', () => {
    expect(fixed('Payment due 5 Oct\n2500 EUR')).toBe('Payment due 5 Oct 2026\n2500 EUR')
    expect(fixed('Standup 2026-10-17\n10:00 breakfast')).toBe('Standup 17 Oct 2026\n10:00 breakfast')
  })

  it('leaves code, links and HTML as typed', () => {
    const text = '---\ndue: 2026-10-17\n---\n`2026-10-17` [2026-10-17](a.md) https://x.com/2026-10-17 <time datetime="2026-10-17">\n\n```\n2026-10-17\n```\n\n    code 2026-10-17\n\n[17.10.2026] ref\n\n[17.10.2026]: http://x\n\n2026-10-17\n'
    expect(fixed(text)).toBe(text.replace(/2026-10-17\n$/, '17 Oct 2026\n').replace('due: 2026-10-17', 'due: 17 Oct 2026'))
  })

  it('writes the dates of properties too, as text', () => {
    expect(fixed('---\ndue: 2025-03-18\nstatus: Done\nstart: 17.10.2026 2pm\nfrom: [2026-10-17, x]\nwhen: [2026-10-17 9am, x]\nnote: Call on Oct 17, 2026 about [2026-10-18](a.md)\n---\nText 2025-03-18\n'))
      .toBe('---\ndue: 18 Mar 2025\nstatus: Done\nstart: 17 Oct 2026, 14:00\nfrom: [17 Oct 2026, x]\nwhen:\n  - 17 Oct 2026, 09:00\n  - x\nnote: Call on 17 Oct 2026 about [2026-10-18](a.md)\n---\nText 18 Mar 2025\n')
    const done = '---\ndue: 18 Mar 2025\n---\n| 17 Oct 2026, 14:00 | Pay |\n'
    expect(fixed(done)).toBe(done)
  })

  it('formats with or without a time', () => {
    expect(formatDate({ year: 2026, month: 1, day: 5 })).toBe('5 Jan 2026')
    expect(formatDate({ year: 2026, month: 12, day: 31, hour: 7, minute: 5 })).toBe('31 Dec 2026, 07:05')
  })

  it('finds the dates the preview shows, and moves one to another day', () => {
    const md = '---\ndue: 2026-01-02\n---\nShip on 17 Oct 2026, 14:30 `2026-10-18` and [x](2026-10-19)\n'
    const spans = dateSpans(md, now)
    expect(spans.map(s => md.slice(s.start, s.end))).toEqual(['17 Oct 2026, 14:30'])
    expect(withDate(md, spans[0], { year: 2026, month: 11, day: 3, hour: 14, minute: 30 })).toContain('Ship on 3 Nov 2026, 14:30 `')
    expect(withDate(md, spans[0], { year: 2026, month: 11, day: 3 })).toContain('Ship on 3 Nov 2026 `')
    expect(valueDate('17 Oct 2026', now)).toEqual({ year: 2026, month: 10, day: 17 })
    expect(valueDate('due 17 Oct 2026', now)).toBeNull()
    expect(valueDate('', now)).toBeNull()
  })

  it('takes a time on its own, written 14:30', () => {
    expect(fixed('Call at 2:30pm, lunch 1pm, gym 9 a.m.')).toBe('Call at 14:30, lunch 13:00, gym 09:00')
    expect(findDates('Standup 9:05 then', now)).toEqual([{ start: 8, end: 12, date: { hour: 9, minute: 5 } }])
    expect(findDates('17 Oct 2026, 14:30', now)).toHaveLength(1)
    expect(valueDate('14:30', now)).toEqual({ hour: 14, minute: 30 })
  })
})
