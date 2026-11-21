import { describe, it, expect } from 'vitest'
import { reminderKey, isReminderKey, reminderValue } from './reminders.js'
import { withValue } from './frontmatter.js'

describe('reminders', () => {
  it('names a date\'s reminder after it and reads only known values', () => {
    expect(reminderKey('date')).toBe('date-reminder')
    expect(isReminderKey('date-reminder')).toBe(true)
    expect(isReminderKey('-reminder')).toBe(false)
    expect(isReminderKey('date')).toBe(false)
    expect(reminderValue(' 1h ')).toBe('1h')
    expect(reminderValue('5 years')).toBe('')
    expect(reminderValue(['1h'])).toBe('')
  })
  it('takes a property out when its value is null', () => {
    const text = '---\ndate: 2026-11-21\ndate-reminder: 1h\n---\nBody\n'
    expect(withValue(text, 'date-reminder', null)).toBe('---\ndate: 2026-11-21\n---\nBody\n')
    expect(withValue('---\ndate: 2026-11-21\n---\n', 'date-reminder', '10m')).toBe('---\ndate: 2026-11-21\ndate-reminder: 10m\n---\n')
  })
})
