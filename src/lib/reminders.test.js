import { describe, it, expect } from 'vitest'
import { reminderKey, isReminderKey, parseReminder, reminderText, reminderAt, remindersIn, DAY_HOUR, isReminderOf, canRemind } from './reminders.js'
import { withValue, withoutKeys } from './frontmatter.js'

describe('reminders', () => {
  it('names a date\'s reminder after it and reads what\'s written', () => {
    expect(reminderKey('date')).toBe('date-reminder')
    expect(isReminderKey('date-reminder')).toBe(true)
    expect(isReminderKey('-reminder')).toBe(false)
    expect(parseReminder(' 1h ')).toBe('1h')
    expect(parseReminder('1h, email')).toBe('1h')
    expect(parseReminder('email')).toBe('')
    expect(parseReminder('5 years')).toBe('')
    expect(parseReminder(['1h'])).toBe('')
    expect(reminderText('1d')).toBe('1d')
    expect(reminderText('')).toBeNull()
  })

  it('is a date\'s reminder only beside its date, with a reminder\'s value', () => {
    const props = [{ key: 'due', value: '2026-11-28' }, { key: 'due-reminder', value: '1h' }, { key: 'follow-reminder', value: 'ask Bob' }, { key: 'x-reminder', value: '1h' }]
    expect(props.map(p => isReminderOf(props, p.key))).toEqual([false, true, false, false])
    expect(canRemind('Life/a.md')).toBe(true)
    expect(canRemind('.archive/2026-11-21/a.md')).toBe(false)
  })

  it('takes a date\'s reminder out with the date', () => {
    expect(withoutKeys('---\ndue: 2026-11-28\ndue-reminder: 1h\nx: 1\n---\n', ['due'])).toBe('---\nx: 1\n---\n')
  })

  it('takes a property out when its value is null', () => {
    const text = '---\ndate: 2026-11-21\ndate-reminder: 1h\n---\nBody\n'
    expect(withValue(text, 'date-reminder', null)).toBe('---\ndate: 2026-11-21\n---\nBody\n')
    expect(withValue('---\ndate: 2026-11-21\n---\n', 'date-reminder', '10m')).toBe('---\ndate: 2026-11-21\ndate-reminder: 10m\n---\n')
  })

  it('knows when a reminder is due', () => {
    expect(reminderAt({ year: 2026, month: 11, day: 28, hour: 14, minute: 30 }, '1h')).toEqual(new Date(2026, 10, 28, 13, 30))
    expect(reminderAt({ year: 2026, month: 11, day: 28 }, '0m')).toEqual(new Date(2026, 10, 28, DAY_HOUR, 0))
    expect(reminderAt({ year: 2026, month: 11, day: 28 }, '1d')).toEqual(new Date(2026, 10, 27, DAY_HOUR, 0))
    expect(reminderAt({ hour: 9, minute: 0 }, '1h')).toBeNull()
  })

  it('finds the notes\' reminders, soonest first', () => {
    const notes = {
      'a.md': '---\ndue: 2026-11-28 14:30\ndue-reminder: 1h, email\n---\n# Dentist\n',
      'b.md': '---\ndate: 2026-11-25\ndate-reminder: 0m\n---\n',
      'c.md': '---\ndate: 2026-11-25\n---\n',
      '.archive/2026-11-21/d.md': '---\ndate: 2026-11-25\ndate-reminder: 0m\n---\n',
    }
    const found = remindersIn(notes)
    expect(found.map(r => [r.path, r.title])).toEqual([['b.md', 'b'], ['a.md', 'Dentist']])
    expect(found[1].at).toBe(new Date(2026, 10, 28, 13, 30).getTime())
  })
})
