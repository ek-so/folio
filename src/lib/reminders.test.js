import { describe, it, expect } from 'vitest'
import { reminderKey, isReminderKey, parseReminder, reminderText, reminderAt, remindersIn, DAY_HOUR } from './reminders.js'
import { withValue } from './frontmatter.js'

describe('reminders', () => {
  it('names a date\'s reminder after it and reads what\'s written', () => {
    expect(reminderKey('date')).toBe('date-reminder')
    expect(isReminderKey('date-reminder')).toBe(true)
    expect(isReminderKey('-reminder')).toBe(false)
    expect(parseReminder(' 1h ')).toEqual({ offset: '1h', email: false })
    expect(parseReminder('1h, email')).toEqual({ offset: '1h', email: true })
    expect(parseReminder('email')).toEqual({ offset: '', email: false })
    expect(parseReminder('5 years')).toEqual({ offset: '', email: false })
    expect(parseReminder(['1h'])).toEqual({ offset: '', email: false })
    expect(reminderText({ offset: '10m', email: true })).toBe('10m, email')
    expect(reminderText({ offset: '1d', email: false })).toBe('1d')
    expect(reminderText({ offset: '', email: true })).toBeNull()
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
    }
    const found = remindersIn(notes)
    expect(found.map(r => [r.path, r.title, r.email])).toEqual([['b.md', 'b', false], ['a.md', 'Dentist', true]])
    expect(found[1].at).toBe(new Date(2026, 10, 28, 13, 30).getTime())
  })
})
