import { properties, noteTitle } from '@/lib/frontmatter.js'
import { valueDate } from '@/lib/markdown.js'
import { parseRecurrence, occursOn } from './recurrence.js'

// A planner widget: a folder whose notes are cards, each on the day of its `date`
// property, shown on a ribbon of days. Each planner's settings live in the repo, beside the views:
// `.folio/planners/<id>.json`, { "folder", "properties": [keys shown on cards besides the date] }.
// The date and type (one-time or recurring) are always shown, can't be turned off, renamed or removed, and come back
// into a card's note when it's saved without them.

export const plannerPath = id => `.folio/planners/${id}.json`

// The property that holds a card's day
export const DATE = 'date'
// The property that says whether a card happens once or how it repeats (recurrence.js)
export const TYPE = 'type'
// The properties every card of a planner has
export const FIXED = [DATE, TYPE]

const strings = list => Array.isArray(list) ? list.filter(s => typeof s === 'string' && !FIXED.includes(s)) : []

// The planner a file's text holds, or null when it can't be read as one
export function parsePlanner(text) {
  try {
    const data = JSON.parse(text)
    if (typeof data?.folder !== 'string') return null
    return { folder: data.folder, properties: strings(data.properties) }
  } catch {
    return null
  }
}

export const serializePlanner = planner => JSON.stringify(planner, null, 2) + '\n'

export const newPlanner = folder => ({ folder, properties: [] })

export const plannerTitle = (planner, repoName) => planner.folder.split('/').pop() || repoName

// The planner after the file or folder (`isDir`) at `from` moved to `to`: its folder follows
export function movedPlanner(planner, from, to) {
  const { folder } = planner
  return folder !== '' && (folder === from || folder.startsWith(from + '/')) ? { ...planner, folder: to + folder.slice(from.length) } : planner
}

const pad = n => String(n).padStart(2, '0')

// A day ({ year, month, day }) as its key, "2026-11-06": keys sort and compare as days do
export const dayKey = ({ year, month, day }) => `${year}-${pad(month)}-${pad(day)}`

// The day a key names, as { year, month, day }
export const keyDay = key => { const [year, month, day] = key.split('-').map(Number); return { year, month, day } }

export const todayKey = (now = new Date()) => dayKey({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() })

// The key `n` days after (before, when negative) the day `key`
export function addDays(key, n) {
  const { year, month, day } = keyDay(key)
  const d = new Date(Date.UTC(year, month - 1, day + n))
  return dayKey({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() })
}

// Where each of `days` starts on the ribbon: each takes `width`, and a month's first day (but the very first) has `gap` before it, its separator
export function dayOffsets(days, width, gap) {
  let x = 0
  return days.map((key, i) => {
    if (i > 0 && keyDay(key).day === 1) x += gap
    const at = x
    x += width
    return at
  })
}

// The index of the day at `x` on the ribbon (`offsets` from dayOffsets): the last one starting at or before it
export function dayAt(offsets, x) {
  let lo = 0, hi = offsets.length - 1
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (offsets[mid] <= x) lo = mid
    else hi = mid - 1
  }
  return lo
}

// How many days `to` is after `from` (negative when before)
export function daysBetween(from, to) {
  const utc = key => { const { year, month, day } = keyDay(key); return Date.UTC(year, month - 1, day) }
  return Math.round((utc(to) - utc(from)) / 86400000)
}

// The card's date: { year, month, day, hour?, minute? }, or null when its `date` is empty or isn't one date
export const cardDate = text => {
  const value = properties(text)[DATE]
  const date = typeof value === 'string' ? valueDate(value) : null
  return date?.year === undefined ? null : date // a time alone isn't a day
}

// Where a card's `date` goes when dropped on the day `key`: the same property value written as
// "17 Oct 2026", keeping its time (the caller formats it, lib/dates.js `formatDate`)
export const droppedDate = (text, key) => {
  const old = text === undefined ? null : cardDate(text)
  const day = keyDay(key)
  return old?.hour === undefined ? day : { ...day, hour: old.hour, minute: old.minute }
}

// `cards` ([{ path, text }]) arranged by day, as of `today` (a key): `on(key)` is what a day lists,
// [{ path, overdue, undated }] by time, then title: the cards dated that day or repeating on it (their `type`, from
// their date on: recurrence.js), and under today also the cards without a date (`undated`) and those dated before
// today that don't repeat (`overdue`; they also stay on their own day); `count(key)` is how many that is. Each day is worked out once.
export function plan(cards, today) {
  const dated = new Map() // key → [{ path, time, title }]
  const loose = [] // without a date
  const past = [] // dated before today
  const repeating = [] // [{ entry, start, rule }]
  for (const { path, text } of cards) {
    const date = cardDate(text)
    const title = noteTitle(text, path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, ''))
    const entry = { path, title, time: date?.hour === undefined ? '99:99' : `${pad(date.hour)}:${pad(date.minute)}` }
    if (!date) { loose.push(entry); continue }
    const key = dayKey(date)
    const rule = parseRecurrence(properties(text)[TYPE])
    if (rule?.kind === 'repeat') { repeating.push({ entry, start: key, rule }); continue }
    if (dated.has(key)) dated.get(key).push(entry)
    else dated.set(key, [entry])
    if (key < today) past.push(entry)
  }
  const order = (a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title)
  const days = new Map()
  const on = key => {
    if (!days.has(key)) {
      const repeats = repeating.filter(r => occursOn(r.rule, r.start, key)).map(r => r.entry)
      const own = [...(dated.get(key) ?? []), ...repeats].map(e => ({ ...e, overdue: false, undated: false }))
      const extra = key === today ? [...loose.map(e => ({ ...e, overdue: false, undated: true })), ...past.map(e => ({ ...e, overdue: true, undated: false }))] : []
      days.set(key, [...own, ...extra].sort(order).map(({ path, overdue, undated }) => ({ path, overdue, undated })))
    }
    return days.get(key)
  }
  return { on, count: key => on(key).length }
}

// What a month's label says
export const monthLabel = key => new Date(Date.UTC(keyDay(key).year, keyDay(key).month - 1, 1))
  .toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })
