import { properties, noteTitle, withKeys, withKeysFirst, DESCRIPTION } from '@/lib/frontmatter.js'
import { valueDate } from '@/lib/markdown.js'
import { parseRecurrence, nextOccurrence } from './recurrence.js'

// A planner widget: a folder whose notes are cards, each on the day of its `date`
// property, shown on a ribbon of days. Each planner's settings live in the repo, beside the views:
// `.folio/planners/<id>.json`, { "folder", "properties": [keys shown on cards besides the date], "sort" (how a day's cards
// are ordered: SORTS, or "property:<key>"; "time" when left out), "order": { day key: [cards' paths inside the folder] }
// (the manual order of each day it was set for; none when left out) }. Calendar or list
// (VIEWS) is this device's choice, not a setting (usePlanner).
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

// A note of the planner's folder as a card: the ORDER properties it lacks added, empty, and all of them on top in that order
export const asCard = text => withKeysFirst(withKeys(text, ORDER), ORDER)

const strings = list => Array.isArray(list) ? list.filter(s => typeof s === 'string' && !FIXED.includes(s)) : []

// How a planner shows its cards: a ribbon of days with the selected day's cards, or every card in groups of time (listed);
// the first unless another was picked on this device
export const VIEWS = ['calendar', 'list']

// How a day's cards can be ordered (the calendar view's): by time (the default), title, or as dragged (manual); or by a
// property's value, "property:<key>"
export const SORTS = ['time', 'title', 'manual']
export const PROPERTY_SORT = 'property:'
export const DEFAULT_SORT = SORTS[0]
const isSort = s => typeof s === 'string' && (SORTS.includes(s) || (s.startsWith(PROPERTY_SORT) && s.length > PROPERTY_SORT.length))

// A saved manual order: day keys to lists of paths, anything else left out
function orders(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value)
    .filter(([key, list]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && Array.isArray(list))
    .map(([key, list]) => [key, list.filter(s => typeof s === 'string')]))
}

// The planner a file's text holds, or null when it can't be read as one
export function parsePlanner(text) {
  try {
    const data = JSON.parse(text)
    if (typeof data?.folder !== 'string') return null
    // an older one's "view" is left out
    return { folder: data.folder, properties: strings(data.properties), sort: isSort(data.sort) ? data.sort : DEFAULT_SORT, order: orders(data.order) }
  } catch {
    return null
  }
}

// The default sort and an empty order aren't written, so a planner that never used them keeps its file as it was
export function serializePlanner({ sort, order, ...rest }) {
  const data = { ...rest, ...(sort !== DEFAULT_SORT && { sort }), ...(Object.keys(order).length > 0 && { order }) }
  return JSON.stringify(data, null, 2) + '\n'
}

export const newPlanner = folder => ({ folder, properties: [], sort: DEFAULT_SORT, order: {} })

export const plannerTitle = (planner, repoName) => planner.folder.split('/').pop() || repoName

// Where `path` sits inside the planner's folder ('' for the repo's root), or null when it's outside it
const keyIn = (folder, path) => !folder ? path : path.startsWith(folder + '/') ? path.slice(folder.length + 1) : null

// The planner after the file or folder (`isDir`) at `from` moved to `to`: its folder follows, and so do the
// cards in its manual order (kept by their place inside the folder)
export function movedPlanner(planner, from, to, isDir = false) {
  const { folder } = planner
  if (folder !== '' && (folder === from || folder.startsWith(from + '/'))) return { ...planner, folder: to + folder.slice(from.length) }
  const [was, now] = [keyIn(folder, from), keyIn(folder, to)]
  if (was === null || now === null || !Object.keys(planner.order).length) return planner
  const follow = k => k === was ? now : isDir && k.startsWith(was + '/') ? now + k.slice(was.length) : k
  return { ...planner, order: Object.fromEntries(Object.entries(planner.order).map(([day, keys]) => [day, keys.map(follow)])) }
}

// `planner` with the day `key`'s cards in the order `paths`, now sorted manually
export const orderedDay = (planner, key, paths) => ({
  ...planner, sort: 'manual', order: { ...planner.order, [key]: paths.map(p => keyIn(planner.folder, p)).filter(k => k !== null) },
})

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
const GROUPS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
  { key: 'later', label: 'Later' },
]

// `cards` ([{ path, text }]) in the list view's groups as of `today` (a key): [{ key, label, first, cards: [{ path, overdue,
// undated }] }], only the groups with cards; `first`: the group's first day (a key; a new task there gets it). Today also has the cards without a date (`undated`, last) and those dated
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
  const groups = GROUPS.map((g, i) => ({ ...g, first: i ? addDays(ends[i - 1], 1) : today, cards: [] }))
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

// The text a card is sorted by for a property sort: its value (a list's values joined), '' when it has none
const sortValue = (value) => Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value.trim() : ''

// How two cards of a day ({ path, time, title, value }) compare under `sort`; `at(path)`: a card's place in the day's
// manual order (Infinity when it has none). Ties, and cards without a manual place, go by time, then title; a property
// sort puts cards without a value last and compares numbers as numbers
export function dayOrder(sort, at) {
  const byTime = (a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title)
  if (sort === 'title') return (a, b) => a.title.localeCompare(b.title) || a.time.localeCompare(b.time)
  if (sort === 'manual') return (a, b) => (at(a.path) - at(b.path)) || byTime(a, b)
  if (sort.startsWith(PROPERTY_SORT)) {
    return (a, b) => (!a.value - !b.value) || a.value.localeCompare(b.value, undefined, { numeric: true, sensitivity: 'base' }) || byTime(a, b)
  }
  return byTime
}

// `cards` ([{ path, text }]) arranged by day, as of `today` (a key), each day ordered as `planner` says (its `sort`, and
// its `order` when manual; dayOrder): `on(key)` is what a day lists, [{ path, overdue, undated }]: the cards dated that
// day (a repeating card too: its date is its next time, moved on by Mark as done), and under today also the cards without
// a date (`undated`) and those dated before today (`overdue`; they also stay on their own day); `count(key)` is how many
// that is. Each day is worked out once.
export function plan(cards, today, planner = newPlanner('')) {
  const { sort } = planner
  const property = sort.startsWith(PROPERTY_SORT) ? sort.slice(PROPERTY_SORT.length) : null
  const dated = new Map() // key → [{ path, time, title }]
  const loose = [] // without a date
  const past = [] // dated before today
  for (const { path, text } of cards) {
    const date = cardDate(text)
    const title = noteTitle(text, path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, ''))
    const entry = { path, title, time: date?.hour === undefined ? '99:99' : `${pad(date.hour)}:${pad(date.minute)}`, value: property ? sortValue(properties(text)[property]) : '' }
    if (!date) { loose.push(entry); continue }
    const key = dayKey(date)
    if (dated.has(key)) dated.get(key).push(entry)
    else dated.set(key, [entry])
    if (key < today) past.push(entry)
  }
  const days = new Map()
  const on = key => {
    if (!days.has(key)) {
      const saved = new Map((planner.order[key] ?? []).map((k, i) => [planner.folder ? `${planner.folder}/${k}` : k, i]))
      const order = dayOrder(sort, path => saved.get(path) ?? Infinity)
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
