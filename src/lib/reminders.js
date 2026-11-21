// A date property's reminder: how long before its date and time it should remind (to be sent later; nothing notifies
// yet). Kept in the note, beside the date, as a property of its own named after it: `date-reminder: 1h` for `date`
// (the note's content, not Folio's settings: it says when its event needs you). Its values, with their labels in the
// date picker; '' is none (the property is taken out)
export const REMINDERS = [
  ['', 'None'],
  ['0m', 'At the time'],
  ['10m', '10 minutes before'],
  ['1h', '1 hour before'],
  ['1d', '1 day before'],
]

const SUFFIX = '-reminder'

// The property that holds the reminder of date property `key`
export const reminderKey = key => key + SUFFIX

// Whether a property is a date's reminder (shown on its date, not as a badge of its own)
export const isReminderKey = key => key.endsWith(SUFFIX) && key.length > SUFFIX.length

// A reminder's value as written, or '' when it's none or not one of REMINDERS
export const reminderValue = value => typeof value === 'string' && REMINDERS.some(([v]) => v && v === value.trim()) ? value.trim() : ''
