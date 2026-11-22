import { frontMatter, noteTitle, REMINDER_SUFFIX } from './frontmatter.js'
import { valueDate } from './markdown.js'

// A date property's reminder: how long before its date and time to remind. Kept in the note, beside the date, as a
// property of its own named after it: `date-reminder: 1h` for `date` (the note's content, not Folio's settings: it says
// when its event needs you). The offsets, with their labels in the date picker ('' is none: the property is taken out)
export const REMINDERS = [
  ['0m', 'At the time'],
  ['10m', '10 minutes before'],
  ['1h', '1 hour before'],
  ['1d', '1 day before'],
]

const MINUTES = { '0m': 0, '10m': 10, '1h': 60, '1d': 24 * 60 }
const SUFFIX = REMINDER_SUFFIX

// A day without a time reminds as if it were at this hour
export const DAY_HOUR = 9

// The property that holds the reminder of date property `key`
export const reminderKey = key => key + SUFFIX

// Whether a property's name is that of a date's reminder (`due-reminder`)
export const isReminderKey = key => key.endsWith(SUFFIX) && key.length > SUFFIX.length

// The date property a reminder's name is named after: 'due' for 'due-reminder'
export const reminderDateKey = key => key.slice(0, -SUFFIX.length)

// Whether property `key` of a note (`props`: [{ key, value }]) is its date's reminder: named after a property the note
// has, with a reminder's value. Only then is it shown on its date (a bell) rather than as a property of its own: a
// `follow-reminder: ask Bob` is a property like any other
export const isReminderOf = (props, key) => isReminderKey(key) && props.some(p => p.key === reminderDateKey(key))
  && Boolean(parseReminder(props.find(p => p.key === key)?.value))

// Whether a note at `path` can remind: not one in a hidden folder (the archive, .folio, .github)
export const canRemind = path => !path.split('/').slice(0, -1).some(folder => folder.startsWith('.'))

// A reminder's offset as written (a REMINDERS value), '' for none or one it doesn't know. The first one it knows among
// comma-separated parts, so `1h, email`, written when reminders could also be emailed, still reminds an hour before
export function parseReminder(value) {
  const parts = typeof value === 'string' ? value.split(',').map(p => p.trim().toLowerCase()) : []
  return parts.find(p => p in MINUTES) ?? ''
}

// What's written for a reminder of `offset`: '1h', or null for none (the property taken out: withValue)
export const reminderText = offset => offset || null

// When a reminder of `offset` for `date` (lib/dates.js parts; a day without a time at DAY_HOUR) is due, as a Date;
// null for a time alone or no offset
export function reminderAt(date, offset) {
  if (!date || date.year === undefined || !(offset in MINUTES)) return null
  const at = new Date(date.year, date.month - 1, date.day, date.hour ?? DAY_HOUR, date.minute ?? 0)
  return new Date(at.getTime() - MINUTES[offset] * 60_000)
}

// Every reminder the notes (`notes`: { path: text }; not those in hidden folders, `canRemind`) hold: [{ id, path, title, key, date, at (ms) }], soonest
// first. `id` names the reminder at its time, so one already shown isn't shown again
export function remindersIn(notes) {
  const found = []
  for (const [path, text] of Object.entries(notes)) {
    if (!canRemind(path)) continue // a removed note in the archive reminds no more
    const props = frontMatter(text)?.props
    if (!props) continue
    for (const prop of props) {
      if (!isReminderKey(prop.key)) continue
      const key = prop.key.slice(0, -SUFFIX.length)
      const offset = parseReminder(prop.value)
      const date = valueDate(props.find(p => p.key === key)?.value)
      const at = reminderAt(date, offset)
      if (!at) continue
      const title = noteTitle(text, path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, ''))
      found.push({ id: `${path}|${key}|${at.getTime()}`, path, title, key, date, at: at.getTime() })
    }
  }
  return found.sort((a, b) => a.at - b.at)
}

// Notifications (the page): of `reminders` (remindersIn), those that have come due by `now` and weren't dismissed on
// this device (`dismissed`: a Set of ids), latest first
export const dueReminders = (reminders, now, dismissed) =>
  reminders.filter(r => r.at <= now && !dismissed.has(r.id)).sort((a, b) => b.at - a.at)

// The reminders that came due after `since` (ms) by `now` and weren't told yet (`fired`: a Set of ids): those missed
// while Folio wasn't on screen, told on opening or coming back
export const missedReminders = (reminders, since, now, fired) =>
  reminders.filter(r => r.at > since && r.at <= now && !fired.has(r.id))
