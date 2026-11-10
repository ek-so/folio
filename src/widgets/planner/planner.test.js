import { describe, it, expect } from 'vitest'
import { parsePlanner, serializePlanner, newPlanner, movedPlanner, orderedDay, addDays, daysBetween, dayOffsets, dayAt, dayKey, plan, cardDate, doneNext, droppedDate, listed, monthLabel } from './planner.js'

const note = (date, extra = '') => `---\n${date === null ? '' : `date: ${date}\n`}${extra}---\n# T\n`

describe('planner', () => {
  it('reads its settings, or nothing from bad text; the date is never a chosen property', () => {
    expect(parsePlanner('nope')).toBeNull()
    expect(parsePlanner('{}')).toBeNull()
    const plain = { sort: 'time', order: {} }
    expect(parsePlanner('{"folder":"T","properties":["date","tags"]}')).toEqual({ folder: 'T', properties: ['tags'], ...plain })
    expect(parsePlanner('{"folder":"T","properties":[],"view":"list"}')).toEqual({ folder: 'T', properties: [], ...plain }) // an older one's view isn't kept
    expect(parsePlanner('{"folder":"T","properties":["priority","repeat"]}')).toEqual({ folder: 'T', properties: ['priority'], ...plain })
    expect(parsePlanner('{"folder":"T","sort":"nonsense","order":{"x":["a.md"],"2026-11-06":["a.md",3]}}'))
      .toEqual({ folder: 'T', properties: [], sort: 'time', order: { '2026-11-06': ['a.md'] } })
    const p = { ...newPlanner('T'), properties: ['tags'] }
    expect(parsePlanner(serializePlanner(p))).toEqual(p)
    expect(serializePlanner(p)).not.toMatch(/sort|order/) // the defaults aren't written
    const sorted = { ...p, sort: 'property:priority', order: { '2026-11-06': ['b.md', 'a.md'] } }
    expect(parsePlanner(serializePlanner(sorted))).toEqual(sorted)
  })

  it('follows its folder when it moves', () => {
    expect(movedPlanner(newPlanner('A/T'), 'A', 'B')).toEqual(newPlanner('B/T'))
    expect(movedPlanner(newPlanner('A/T'), 'A/T/x.md', 'A/T/y.md')).toEqual(newPlanner('A/T'))
    expect(movedPlanner(newPlanner(''), 'A', 'B')).toEqual(newPlanner(''))
  })

  it('keeps a manual order, its cards following renames', () => {
    const p = orderedDay(newPlanner('T'), '2026-11-06', ['T/b.md', 'T/sub/a.md', 'Elsewhere/x.md'])
    expect(p).toMatchObject({ sort: 'manual', order: { '2026-11-06': ['b.md', 'sub/a.md'] } })
    expect(movedPlanner(p, 'T/b.md', 'T/c.md').order['2026-11-06']).toEqual(['c.md', 'sub/a.md'])
    expect(movedPlanner(p, 'T/sub', 'T/new', true).order['2026-11-06']).toEqual(['b.md', 'new/a.md'])
  })

  it('sorts a day by time, title, a property or by hand', () => {
    const cards = [
      { path: 'T/a.md', text: note('2026-11-06, 15:00', 'title: Apple\npriority: 2\n') },
      { path: 'T/b.md', text: note('2026-11-06, 9:00', 'title: Banana\npriority: 10\n') },
      { path: 'T/c.md', text: note('2026-11-06', 'title: Cherry\n') },
    ]
    const day = planner => plan(cards, '2026-11-06', planner).on('2026-11-06').map(c => c.path)
    expect(day(newPlanner('T'))).toEqual(['T/b.md', 'T/a.md', 'T/c.md']) // time; no time last
    expect(day({ ...newPlanner('T'), sort: 'title' })).toEqual(['T/a.md', 'T/b.md', 'T/c.md'])
    expect(day({ ...newPlanner('T'), sort: 'property:priority' })).toEqual(['T/a.md', 'T/b.md', 'T/c.md']) // 2 before 10; none last
    expect(day(orderedDay(newPlanner('T'), '2026-11-06', ['T/c.md', 'T/a.md']))).toEqual(['T/c.md', 'T/a.md', 'T/b.md']) // unplaced by time
  })

  it('counts days', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(daysBetween('2026-11-06', '2026-12-01')).toBe(25)
    expect(daysBetween('2026-03-01', '2026-02-28')).toBe(-1)
  })

  it('places days on the ribbon with a gap before each month', () => {
    const offsets = dayOffsets(['2026-10-31', '2026-11-01', '2026-11-02', '2026-12-01'], 80, 9)
    expect(offsets).toEqual([0, 89, 169, 258])
    expect(dayOffsets(['2026-11-01', '2026-11-02'], 80, 9)).toEqual([0, 80])
    expect(dayAt(offsets, 0)).toBe(0)
    expect(dayAt(offsets, 88)).toBe(0)
    expect(dayAt(offsets, 89)).toBe(1)
    expect(dayAt(offsets, 1000)).toBe(3)
    expect(dayKey({ year: 2026, month: 1, day: 5 })).toBe('2026-01-05')
    expect(monthLabel('2026-11-06')).toBe('November 2026')
  })

  it('reads a card\'s day in any clear format, not a time alone', () => {
    expect(cardDate(note('17 Oct 2026, 14:30'))).toMatchObject({ year: 2026, month: 10, day: 17, hour: 14 })
    expect(cardDate(note('2026-10-17'))).toMatchObject({ year: 2026, month: 10, day: 17 })
    expect(cardDate(note('14:30'))).toBeNull()
    expect(cardDate(note('soon'))).toBeNull() // not a day: the card has no date
    expect(cardDate(note(null))).toBeNull()
  })

  it('keeps the time of a card dropped on another day', () => {
    expect(droppedDate(note('17 Oct 2026, 14:30'), '2026-11-02')).toEqual({ year: 2026, month: 11, day: 2, hour: 14, minute: 30 })
    expect(droppedDate(note(null), '2026-11-02')).toEqual({ year: 2026, month: 11, day: 2 })
    expect(droppedDate(undefined, '2026-11-02')).toEqual({ year: 2026, month: 11, day: 2 })
  })

  it('lists a card on its day; today also has the undated and, overdue, the overdue', () => {
    const cards = [
      { path: 'T/b.md', text: note('2026-11-06', 'title: B\n') }, { path: 'T/a.md', text: note('2026-11-06, 9:00', 'title: A\n') },
      { path: 'T/none.md', text: note(null) }, { path: 'T/old.md', text: note('2026-11-01') }, { path: 'T/next.md', text: note('2026-11-07') },
    ]
    const { on, count } = plan(cards, '2026-11-06')
    expect(on('2026-11-06').map(c => c.path)).toEqual(['T/a.md', 'T/b.md', 'T/none.md', 'T/old.md'])
    expect(on('2026-11-06').find(c => c.path === 'T/old.md')).toMatchObject({ overdue: true, undated: false })
    expect(on('2026-11-06').find(c => c.path === 'T/none.md')).toMatchObject({ overdue: false, undated: true })
    expect(on('2026-11-01')).toEqual([{ path: 'T/old.md', overdue: false, undated: false }])
    expect(on('2026-11-07')).toEqual([{ path: 'T/next.md', overdue: false, undated: false }])
    expect(on('2026-11-08')).toEqual([])
    expect(count('2026-11-06')).toBe(4)
  })

  it('lists a repeating card once, on its date, overdue when that has passed', () => {
    const { on } = plan([{ path: 'T/weekly.md', text: note('4 Nov 2026', 'repeat: weekly\n') }], '2026-11-07')
    expect(on('2026-11-04')).toEqual([{ path: 'T/weekly.md', overdue: false, undated: false }])
    expect(on('2026-11-11')).toEqual([])
    expect(on('2026-11-07')).toEqual([{ path: 'T/weekly.md', overdue: true, undated: false }])
  })

  it('moves a repeating card on when done, archives any other', () => {
    const today = '2026-11-07' // a Saturday
    expect(doneNext(note('4 Nov 2026', 'repeat: weekly\n'), today)).toBe('2026-11-11')
    expect(doneNext(note('7 Nov 2026', 'repeat: daily\n'), today)).toBe('2026-11-08') // done today: tomorrow
    expect(doneNext(note('1 Nov 2026', 'repeat: daily\n'), today)).toBe('2026-11-08') // behind: one click catches up
    expect(doneNext(note('26 Oct 2026', 'repeat: every 2 weeks on Mon\n'), today)).toBe('2026-11-09') // its rhythm kept
    expect(doneNext(note('20 Nov 2026', 'repeat: weekly\n'), today)).toBe('2026-11-27') // done early
    expect(doneNext(note('4 Nov 2026', 'repeat: weekly until 10 Nov 2026\n'), today)).toBeNull()
    expect(doneNext(note('1 Nov 2026', 'repeat: daily until 7 Nov 2026\n'), today)).toBeNull()
    expect(doneNext(note('4 Nov 2026', 'repeat: recurring\n'), today)).toBeNull()
    expect(doneNext(note('4 Nov 2026', 'repeat: one-time\n'), today)).toBeNull()
    expect(doneNext(note(null, 'repeat: weekly\n'), today)).toBeNull()
  })

  it('groups every card by when it is, for the list view', () => {
    const today = '2026-11-07' // a Saturday
    const card = (name, date) => ({ path: `T/${name}.md`, text: note(date) })
    const groups = listed([
      card('later', '1 Feb 2027'), card('year', '20 Dec 2026'), card('month', '30 Nov 2026'), card('week', null),
      card('sunday', '8 Nov 2026'), card('today', '7 Nov 2026'), card('late', '1 Nov 2026'), card('monday', '9 Nov 2026'),
    ], today)
    expect(groups.map(g => [g.key, g.cards.map(c => c.path.slice(2, -3))])).toEqual([
      ['today', ['late', 'today', 'week']],
      ['tomorrow', ['sunday']], // Sunday is tomorrow, so This week has nothing left and isn't shown
      ['month', ['monday', 'month']],
      ['year', ['year']],
      ['later', ['later']],
    ])
    expect(groups.map(g => g.first)).toEqual(['2026-11-07', '2026-11-08', '2026-11-09', '2026-12-01', '2027-01-01'])
    expect(groups[0].cards[0]).toEqual({ path: 'T/late.md', overdue: true, undated: false })
    expect(groups[0].cards[2]).toEqual({ path: 'T/week.md', overdue: false, undated: true })
    expect(listed([card('wed', '11 Nov 2026')], '2026-11-09').map(g => g.key)).toEqual(['week']) // from a Monday
  })
})
