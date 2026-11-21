import { frontMatter, noteTitle } from './frontmatter.js'
import { valueDate } from './markdown.js'

// A date property's reminder: how long before its date and time to remind, and whether by email too. Kept in the note,
// beside the date, as a property of its own named after it: `date-reminder: 1h` for `date`, `1h, email` to send it by
// email as well (the note's content, not Folio's settings: it says when its event needs you). The offsets, with their
// labels in the date picker; '' is none (the property is taken out)
export const REMINDERS = [
  ['', 'None'],
  ['0m', 'At the time'],
  ['10m', '10 minutes before'],
  ['1h', '1 hour before'],
  ['1d', '1 day before'],
]

const MINUTES = { '0m': 0, '10m': 10, '1h': 60, '1d': 24 * 60 }
const SUFFIX = '-reminder'
const EMAIL = 'email'

// A day without a time reminds as if it were at this hour
export const DAY_HOUR = 9

// The property that holds the reminder of date property `key`
export const reminderKey = key => key + SUFFIX

// Whether a property is a date's reminder (shown on its date, not as a badge of its own)
export const isReminderKey = key => key.endsWith(SUFFIX) && key.length > SUFFIX.length

// A reminder's value as written: { offset (a REMINDERS value, '' for none or one it doesn't know), email }
export function parseReminder(value) {
  const parts = typeof value === 'string' ? value.split(',').map(p => p.trim().toLowerCase()) : []
  const offset = parts.find(p => p in MINUTES) ?? ''
  return { offset, email: Boolean(offset) && parts.includes(EMAIL) }
}

// What's written for a reminder: '1h', '1h, email', or null for none (the property taken out: withValue)
export const reminderText = ({ offset, email }) => !offset ? null : email ? `${offset}, ${EMAIL}` : offset

// When a reminder of `offset` for `date` (lib/dates.js parts; a day without a time at DAY_HOUR) is due, as a Date;
// null for a time alone or no offset
export function reminderAt(date, offset) {
  if (!date || date.year === undefined || !(offset in MINUTES)) return null
  const at = new Date(date.year, date.month - 1, date.day, date.hour ?? DAY_HOUR, date.minute ?? 0)
  return new Date(at.getTime() - MINUTES[offset] * 60_000)
}

// Every reminder the notes (`notes`: { path: text }) hold: [{ id, path, title, key, date, at (ms), email }], soonest
// first. `id` names the reminder at its time, so one already shown isn't shown again
export function remindersIn(notes) {
  const found = []
  for (const [path, text] of Object.entries(notes)) {
    const props = frontMatter(text)?.props
    if (!props) continue
    for (const prop of props) {
      if (!isReminderKey(prop.key)) continue
      const key = prop.key.slice(0, -SUFFIX.length)
      const { offset, email } = parseReminder(prop.value)
      const date = valueDate(props.find(p => p.key === key)?.value)
      const at = reminderAt(date, offset)
      if (!at) continue
      const title = noteTitle(text, path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, ''))
      found.push({ id: `${path}|${key}|${at.getTime()}`, path, title, key, date, at: at.getTime(), email })
    }
  }
  return found.sort((a, b) => a.at - b.at)
}
