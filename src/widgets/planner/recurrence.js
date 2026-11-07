import { valueDate } from '@/lib/markdown.js'
import { formatDate } from '@/lib/dates.js'
import { keyDay, dayKey, addDays, daysBetween } from './planner.js'

// A card's `type`: how often it happens, written in the note so it reads as plain words:
//   one-time
//   recurring                          repeats, how often not picked yet (shown on its own date only)
//   daily | weekly | monthly | yearly  every 1 day, week, month, year
//   every 2 weeks                      every N days, weeks, months, years
//   … on Mon, Wed                      weekly only: on those weekdays (else the date's own weekday)
//   … until 31 Dec 2026                the last day it can happen on
// It repeats from the card's date, which always counts as its first day (even when weekly on other weekdays): monthly on that day of the month (the month's last day when it's shorter),
// yearly on that day of that month.

export const ONE_TIME = 'one-time'
export const UNSET = 'recurring'
export const UNITS = ['day', 'week', 'month', 'year']
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // weekdays are written Mon … Sun
const ONCE_A = { day: 'daily', week: 'weekly', month: 'monthly', year: 'yearly' }

const RULE = /^(?:(daily|weekly|monthly|yearly)|every\s+(\d+)\s+(day|week|month|year)s?)(?:\s+on\s+([a-z,\s]+?))?(?:\s+until\s+(.+))?$/i

// What a `type` value says: { kind: 'one-time' }, { kind: 'unset' } (plain "recurring"),
// { kind: 'repeat', every, unit, weekdays: [0 = Sunday …], until: day key or null }, or null (empty or not one of these)
export function parseRecurrence(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return null
  if (text.toLowerCase() === ONE_TIME) return { kind: 'one-time' }
  if (text.toLowerCase() === UNSET) return { kind: 'unset' }
  const m = RULE.exec(text)
  if (!m) return null
  const unit = m[1] ? Object.keys(ONCE_A).find(u => ONCE_A[u] === m[1].toLowerCase()) : m[3].toLowerCase()
  const every = m[1] ? 1 : Number(m[2])
  if (!(every >= 1)) return null
  const weekdays = []
  if (m[4]) {
    for (const name of m[4].split(/[\s,]+/).filter(Boolean)) {
      const at = WEEKDAYS.findIndex(w => name.toLowerCase().startsWith(w.toLowerCase()))
      if (at < 0 || unit !== 'week') return null
      if (!weekdays.includes(at)) weekdays.push(at)
    }
  }
  let until = null
  if (m[5]) {
    const date = valueDate(m[5].trim())
    if (date?.year === undefined) return null
    until = dayKey(date)
  }
  return { kind: 'repeat', every, unit, weekdays: WEEK_ORDER.filter(d => weekdays.includes(d)), until }
}

// A rule written back as its `type` value (parseRecurrence's opposite)
export function formatRecurrence(rule) {
  if (rule.kind === 'one-time') return ONE_TIME
  if (rule.kind === 'unset') return UNSET
  let text = rule.every === 1 ? ONCE_A[rule.unit] : `every ${rule.every} ${rule.unit}s`
  if (rule.unit === 'week' && rule.weekdays?.length) text += ' on ' + WEEK_ORDER.filter(d => rule.weekdays.includes(d)).map(d => WEEKDAYS[d]).join(', ')
  if (rule.until) text += ' until ' + formatDate(keyDay(rule.until))
  return text
}

const weekday = key => { const { year, month, day } = keyDay(key); return new Date(Date.UTC(year, month - 1, day)).getUTCDay() }
const monday = key => addDays(key, -((weekday(key) + 6) % 7))
const monthDays = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate()

// Whether a card dated `start` with the rule `rule` (kind 'repeat') happens on the day `key`
export function occursOn(rule, start, key) {
  if (key < start || (rule.until && key > rule.until)) return false
  if (key === start) return true
  const a = keyDay(start), b = keyDay(key)
  switch (rule.unit) {
    case 'day': return daysBetween(start, key) % rule.every === 0
    case 'week': {
      const days = rule.weekdays.length ? rule.weekdays : [weekday(start)]
      return days.includes(weekday(key)) && (daysBetween(monday(start), monday(key)) / 7) % rule.every === 0
    }
    case 'month': {
      const months = (b.year - a.year) * 12 + b.month - a.month
      return months % rule.every === 0 && b.day === Math.min(a.day, monthDays(b.year, b.month))
    }
    case 'year':
      return (b.year - a.year) % rule.every === 0 && b.month === a.month && b.day === Math.min(a.day, monthDays(b.year, b.month))
    default: return false
  }
}
