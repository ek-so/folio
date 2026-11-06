import { describe, it, expect } from 'vitest'
import { parsePlanner, serializePlanner, newPlanner, movedPlanner, addDays, dayKey, plan, cardDate, droppedDate, monthLabel } from './planner.js'

const note = (date, extra = '') => `---\n${date === null ? '' : `date: ${date}\n`}${extra}---\n# T\n`

describe('planner', () => {
  it('reads its settings, or nothing from bad text; the date is never a chosen property', () => {
    expect(parsePlanner('nope')).toBeNull()
    expect(parsePlanner('{}')).toBeNull()
    expect(parsePlanner('{"folder":"T","properties":["date","tags"]}')).toEqual({ folder: 'T', properties: ['tags'] })
    const p = { ...newPlanner('T'), properties: ['tags'] }
    expect(parsePlanner(serializePlanner(p))).toEqual(p)
  })

  it('follows its folder when it moves', () => {
    expect(movedPlanner(newPlanner('A/T'), 'A', 'B')).toEqual(newPlanner('B/T'))
    expect(movedPlanner(newPlanner('A/T'), 'A/T/x.md', 'A/T/y.md')).toEqual(newPlanner('A/T'))
    expect(movedPlanner(newPlanner(''), 'A', 'B')).toEqual(newPlanner(''))
  })

  it('counts days', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(dayKey({ year: 2026, month: 1, day: 5 })).toBe('2026-01-05')
    expect(monthLabel('2026-11-06')).toBe('November 2026')
  })

  it('reads a card\'s day in any clear format, not a time alone', () => {
    expect(cardDate(note('17 Oct 2026, 14:30'))).toMatchObject({ year: 2026, month: 10, day: 17, hour: 14 })
    expect(cardDate(note('2026-10-17'))).toMatchObject({ year: 2026, month: 10, day: 17 })
    expect(cardDate(note('14:30'))).toBeNull()
    expect(cardDate(note('soon'))).toBeNull()
    expect(cardDate(note(null))).toBeNull()
  })

  it('keeps the time of a card dropped on another day', () => {
    expect(droppedDate(note('17 Oct 2026, 14:30'), '2026-11-02')).toEqual({ year: 2026, month: 11, day: 2, hour: 14, minute: 30 })
    expect(droppedDate(note(null), '2026-11-02')).toEqual({ year: 2026, month: 11, day: 2 })
    expect(droppedDate(undefined, '2026-11-02')).toEqual({ year: 2026, month: 11, day: 2 })
  })

  it('lists a card on its day; today also has the undated and, faded, the overdue', () => {
    const cards = [
      { path: 'T/b.md', text: note('2026-11-06', 'title: B\n') }, { path: 'T/a.md', text: note('2026-11-06, 9:00', 'title: A\n') },
      { path: 'T/none.md', text: note(null) }, { path: 'T/old.md', text: note('2026-11-01') }, { path: 'T/next.md', text: note('2026-11-07') },
    ]
    const { on, count } = plan(cards, '2026-11-06')
    expect(on('2026-11-06').map(c => c.path)).toEqual(['T/a.md', 'T/b.md', 'T/none.md', 'T/old.md'])
    expect(on('2026-11-06').find(c => c.path === 'T/old.md').faded).toBe(true)
    expect(on('2026-11-01')).toEqual([{ path: 'T/old.md', faded: false }])
    expect(on('2026-11-07')).toEqual([{ path: 'T/next.md', faded: false }])
    expect(on('2026-11-08')).toEqual([])
    expect(count('2026-11-06')).toBe(4)
  })
})
