import { blankFrontMatter } from './frontmatter.js'

// Dates typed in a note's text, in any clear format, and their one written form: "17 Oct 2026, 14:30"
// ("17 Oct 2026" without a time). Recognized: 2026-10-17, 17.10.2026, 17/10/26 (day first),
// 17 Oct, 17th of October 2026, Oct 17, 2026; each optionally followed by a time: 14:30, 2:30pm, 2pm,
// "at 14:30", "T14:30". A missing year is the current one. Words like "tomorrow" aren't dates.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?![a-z])'
const DAY = '(\\d{1,2})(?:st|nd|rd|th)?'
const START = '(?<![\\w./:-])' // not inside a word, a number, a path or a version
const END = '(?!(?!T\\d)\\w|[./:-]\\d)' // a "T" may start a time

// Each pattern and how its groups give { day, month, year } (year may be missing)
const PATTERNS = [
  [`${START}(\\d{4})-(\\d{1,2})-(\\d{1,2})${END}`, m => ({ year: m[1], month: +m[2], day: m[3] })],
  [`${START}(\\d{1,2})([./-])(\\d{1,2})\\2(\\d{4}|\\d{2})${END}`, m => ({ day: m[1], month: +m[3], year: m[4] })],
  [`${START}${DAY}\\s+(?:of\\s+)?${MONTH}(?:\\.?,?\\s+(\\d{4}))?${END}`, m => ({ day: m[1], month: m[2], year: m[3] })],
  [`${START}${MONTH}\\.?\\s+${DAY}(?:,?\\s+(\\d{4}))?${END}`, m => ({ month: m[1], day: m[2], year: m[3] })],
].map(([source, parts]) => [new RegExp(source, 'gi'), parts])

// A time right after a date: ", 14:30", " at 2:30pm", " 2 pm", "T14:30"
const TIME = /(?:,\s*|\s+)?(?:at\s+)?(?:(?<=\d)T)?(?:(\d{1,2}):(\d{2})(?:\s*([ap])\.?m\.?)?|(\d{1,2})\s*([ap])\.?m\.?)(?![\w:])/iy

const monthNumber = month => typeof month === 'number' ? month : MONTHS.indexOf(month.slice(0, 3).toLowerCase()) + 1

// { year, month, day } if it's a real calendar day, else null
function realDay({ year, month, day }, now) {
  const y = year === undefined ? now.getFullYear() : year.length === 2 ? 2000 + +year : +year
  const m = monthNumber(month)
  const d = +day
  const date = new Date(Date.UTC(y, m - 1, d))
  return m >= 1 && m <= 12 && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? { year: y, month: m, day: d } : null
}

// The time at `at` in `text` as { hour, minute, end }, or null
function timeAt(text, at) {
  TIME.lastIndex = at
  const m = TIME.exec(text)
  if (!m) return null
  const half = (m[3] ?? m[5])?.toLowerCase()
  let hour = +(m[1] ?? m[4])
  const minute = +(m[2] ?? 0)
  if (half) {
    if (hour < 1 || hour > 12) return null
    hour = hour % 12 + (half === 'p' ? 12 : 0)
  }
  return hour < 24 && minute < 60 ? { hour, minute, end: at + m[0].length } : null
}

// Every date in `text`, in order: [{ start, end, date: { year, month, day, hour?, minute? } }]
export function findDates(text, now = new Date()) {
  const found = []
  for (const [regex, parts] of PATTERNS) {
    for (const m of text.matchAll(regex)) {
      const p = parts(m)
      if (typeof p.month === 'string' && p.month === 'may') continue // the word, not the month
      const date = realDay(p, now)
      if (!date) continue
      const time = timeAt(text, m.index + m[0].length)
      found.push({ start: m.index, end: time?.end ?? m.index + m[0].length, date: time ? { ...date, hour: time.hour, minute: time.minute } : date })
    }
  }
  // Overlaps: the one starting first, then the longest
  found.sort((a, b) => a.start - b.start || b.end - a.end)
  return found.filter((d, i) => !found.slice(0, i).some(e => d.start < e.end))
}

const pad = n => String(n).padStart(2, '0')

// "17 Oct 2026, 14:30", or "17 Oct 2026" without a time
export function formatDate({ year, month, day, hour, minute }) {
  const name = MONTHS[month - 1]
  const text = `${day} ${name[0].toUpperCase()}${name.slice(1)} ${year}`
  return hour === undefined ? text : `${text}, ${pad(hour)}:${pad(minute)}`
}

// For <time datetime>: "2026-10-17" or "2026-10-17T14:30"
export function isoDate({ year, month, day, hour, minute }) {
  const date = `${year}-${pad(month)}-${pad(day)}`
  return hour === undefined ? date : `${date}T${pad(hour)}:${pad(minute)}`
}

// Where dates are left as typed: the front matter, code, links, URLs and HTML tags
function keptRanges(markdown) {
  const text = blankFrontMatter(markdown)
  const ranges = []
  if (text !== markdown) ranges.push([0, text.search(/\S|$/)])
  // Fenced code blocks, line by line
  let fence = null
  let at = 0
  for (const line of text.split('\n')) {
    const open = /^ {0,3}(`{3,}|~{3,})/.exec(line)
    if (fence) {
      fence.end = at + line.length
      if (open && open[1][0] === fence.mark[0] && open[1].length >= fence.mark.length) { ranges.push([fence.start, fence.end]); fence = null }
    } else if (open) fence = { mark: open[1], start: at, end: at + line.length }
    at += line.length + 1
  }
  if (fence) ranges.push([fence.start, text.length])
  for (const m of text.matchAll(/(`+)[\s\S]*?\1|!?\[[^\]\n]*\]\([^)\n]*\)|^ {0,3}\[[^\]\n]+\]:.*$|<[^>\n]+>|https?:\/\/\S+/gm)) ranges.push([m.index, m.index + m[0].length])
  return ranges
}

// The markdown with every date outside code, links and the front matter written as "17 Oct 2026, 14:30"
export function withFixedDates(markdown, now = new Date()) {
  const kept = keptRanges(markdown)
  let out = ''
  let last = 0
  for (const { start, end, date } of findDates(markdown, now)) {
    if (kept.some(([s, e]) => start < e && end > s)) continue
    out += markdown.slice(last, start) + formatDate(date)
    last = end
  }
  return out + markdown.slice(last)
}
