import { properties, noteTitle, DESCRIPTION } from '@/lib/frontmatter.js'
import { valueDate } from '@/lib/markdown.js'
import { parseRecurrence, nextOccurrence } from './recurrence.js'

// A planner widget: a folder whose notes are cards, each on the day of its `date`
// property, shown on a ribbon of days. Each planner's settings live in the repo, beside the views:
// `.folio/planners/<id>.json`, { "folder", "properties": [keys shown on cards besides the date], "view": "calendar" | "list" }.
// The date and repeat (one-time or how it repeats: recurrence.js) are always shown, can't be turned off, renamed or removed, and come back
// into a card's note when it's saved without them.

export const plannerPath = id => `.folio/planners/${id}.json`

// The property that holds a card's day
export const DATE = 'date'
// The property that says whether a card happens once or how it repeats (recurrence.js)
export const REPEAT = 'repeat'
// The properties every card of a planner has
export const FIXED = [DATE, REPEAT]
// The order a card's properties come in, in its file, on the card and on its page: these first, then the rest
export const ORDER = [DESCRIPTION, DATE, REPEAT]

const strings = list => Array.isArray(list) ? list.filter(s => typeof s === 'string' && !FIXED.includes(s)) : []

// How a planner shows its cards: a ribbon of days with the selected day's cards, or every card in groups of time (listed)
export const VIEWS = ['calendar', 'list']

// The planner a file's text holds, or null when it can't be read as one
export function parsePlanner(text) {
  try {
    const data = JSON.parse(text)
    if (typeof data?.folder !== 'string') return null
    return { folder: data.folder, properties: strings(data.properties), view: VIEWS.includes(data.view) ? data.view : VIEWS[0] }
  } catch {
    return null
  }
}

export const serializePlanner = planner => JSON.stringify(planner, null, 2) + '\n'

export const newPlanner = folder => ({ folder, properties: [], view: VIEWS[0] })

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
export const cardDate = text => dateValue(properties(text)[DATE])

// A `date` property's value as { year, month, day, hour?, minute? }, or null when it's empty or isn't one date
// (a time alone isn't a day); the card's date, read the same way on the card and in its repeat badge
export function dateValue(value) {
  const date = typeof value === 'string' ? valueDate(value) : null
  return date?.year === undefined ? null : date
}

// Where a card's `date` goes when dropped on the day `key`: the same property value written as
// "17 Oct 2026", keeping its time (the caller formats it, lib/dates.js `formatDate`)
export const droppedDate = (text, key) => {
  const old = text === undefined ? null : cardDate(text)
  const day = keyDay(key)
  return old?.hour === undefined ? day : { ...day, hour: old.hour, minute: old.minute }
}

// Where Mark as done on `today` (a key) takes a card: a repeating one with a date, the day of its next time (a key),
// counted from its date so it keeps its rhythm; when that's today or before (it fell behind), the first one after today,
// so one click catches up and a card done today never stays on today. Null for any other card, or one past its last
// time (`until`): it's archived.
export function doneNext(text, today) {
  const rule = parseRecurrence(properties(text)[REPEAT])
  const date = cardDate(text)
  if (rule?.kind !== 'repeat' || !date) return null
  let next = nextOccurrence(rule, dayKey(date))
  while (next && next <= today) next = nextOccurrence(rule, next)
  return next
}

// The list view's groups, in order: a card's day decides its group; each is the time after the one before it
export const GROUPS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
  { key: 'later', label: 'Later' },
]

// `cards` ([{ path, text }]) in the list view's groups as of `today` (a key): [{ key, label, cards: [{ path, overdue,
// undated }] }], only the groups with cards. Today also has the cards without a date (`undated`, last) and those dated
// before today (`overdue`, first); This week runs to Sunday, This month and This year to their last day. In a group, by
// day, time, then title.
export function listed(cards, today) {
  const { year, month } = keyDay(today)
  const ends = [ // the last day of each group but Later
    today,
    addDays(today, 1),
    addDays(today, (7 - new Date(Date.UTC(year, month - 1, keyDay(today).day)).getUTCDay()) % 7),
    dayKey({ year, month, day: new Date(Date.UTC(year, month, 0)).getUTCDate() }),
    `${year}-12-31`,
  ]
  const groups = GROUPS.map(g => ({ ...g, cards: [] }))
  for (const { path, text } of cards) {
    const date = cardDate(text)
    const key = date ? dayKey(date) : null
    const at = key === null || key <= today ? 0 : ends.findIndex(end => key <= end)
    groups[at < 0 ? GROUPS.length - 1 : at].cards.push({
      path, key: key ?? '9999-99-99', time: date?.hour === undefined ? '99:99' : `${pad(date.hour)}:${pad(date.minute)}`,
      title: noteTitle(text, path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '')),
      overdue: key !== null && key < today, undated: key === null,
    })
  }
  const order = (a, b) => a.key.localeCompare(b.key) || a.time.localeCompare(b.time) || a.title.localeCompare(b.title)
  return groups.filter(g => g.cards.length).map(g => ({ ...g, cards: g.cards.sort(order).map(({ path, overdue, undated }) => ({ path, overdue, undated })) }))
}

// `cards` ([{ path, text }]) arranged by day, as of `today` (a key): `on(key)` is what a day lists,
// [{ path, overdue, undated }] by time, then title: the cards dated that day (a repeating card too: its date is its next
// time, moved on by Mark as done), and under today also the cards without a date (`undated`) and those dated before today
// (`overdue`; they also stay on their own day); `count(key)` is how many that is. Each day is worked out once.
export function plan(cards, today) {
  const dated = new Map() // key → [{ path, time, title }]
  const loose = [] // without a date
  const past = [] // dated before today
  for (const { path, text } of cards) {
    const date = cardDate(text)
    const title = noteTitle(text, path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, ''))
    const entry = { path, title, time: date?.hour === undefined ? '99:99' : `${pad(date.hour)}:${pad(date.minute)}` }
    if (!date) { loose.push(entry); continue }
    const key = dayKey(date)
    if (dated.has(key)) dated.get(key).push(entry)
    else dated.set(key, [entry])
    if (key < today) past.push(entry)
  }
  const order = (a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title)
  const days = new Map()
  const on = key => {
    if (!days.has(key)) {
      const own = (dated.get(key) ?? []).map(e => ({ ...e, overdue: false, undated: false }))
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
