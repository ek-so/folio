import { frontMatter, noteTitle, REMINDER_SUFFIX } from './frontmatter.js'
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
const SUFFIX = REMINDER_SUFFIX
const EMAIL = 'email'

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
  && Boolean(parseReminder(props.find(p => p.key === key)?.value).offset)

// Whether a note at `path` can remind: not one in a hidden folder (the archive, .folio, .github)
export const canRemind = path => !path.split('/').slice(0, -1).some(folder => folder.startsWith('.'))

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

// Every reminder the notes (`notes`: { path: text }; not those in hidden folders, `canRemind`) hold: [{ id, path, title, key, date, at (ms), email }], soonest
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

// The email job (src/job/reminders-job.js, a GitHub Action in the notes repo): of `reminders` (remindersIn), those set to
// email that came due within `windowMs` before `now` and aren't in `sent` ({ id: when it was sent, ms }): what a run
// sends. The window spans more than the job's schedule, so a late run still sends what's due; `sent` keeps it once
export const emailsDue = (reminders, sent, now, windowMs) =>
  reminders.filter(r => r.email && r.at <= now && r.at > now - windowMs && !(r.id in sent))

// `sent` without what was sent more than `keepMs` before `now` (it can't come due again)
export const keptSent = (sent, now, keepMs) => Object.fromEntries(Object.entries(sent).filter(([, at]) => at > now - keepMs))
