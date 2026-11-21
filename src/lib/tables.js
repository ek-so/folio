// A note's markdown tables in the preview: each column has a type, which says how its cells show, sort and filter, and
// how a cell changed from the preview is written back into the note. The cells' text stays the content (in the note);
// a type picked for a column is only how Folio shows it, kept in `.folio/tables.json`:
//   { "tables": { "Notes/Tasks.md": { "Status": { "type": "select", "colors": { "Done": 3 } } } },
//     "sorts": { "Notes/Tasks.md": { "Task | Status": { "col": "Status", "dir": "asc" } } } }
// per note, per column name (every table of the note with a column of that name); a table's sort per note and header row.
// Without a picked type, a column gets the one its cells look like (`detectType`); deleting .folio only brings those
// back, and every table's rows in the note's order (Manual).

import { valueDate } from './markdown.js'
import { PROPERTY_COLORS } from './frontmatter.js'
import { movedMap, removedMap } from './pathMap.js'

export const TABLES_PATH = '.folio/tables.json'

// [type, label] in the order the Type menu lists them
export const COLUMN_TYPES = [
  ['text', 'Text'], ['number', 'Number'], ['select', 'Select'], ['multi', 'Multi-select'],
  ['date', 'Date'], ['checkbox', 'Checkbox'], ['link', 'Link'],
]
const TYPES = new Set(COLUMN_TYPES.map(([t]) => t))
export const typeLabel = type => COLUMN_TYPES.find(([t]) => t === type)?.[1] ?? 'Text'

// --- Settings ---

// The settings a file's text holds, { columns, sorts }: empty for no file (undefined), null for text that can't be read
// (never saved over)
export function parseTables(text) {
  if (text === undefined) return { columns: {}, sorts: {} }
  try {
    const data = JSON.parse(text)
    const tables = data?.tables ?? {}
    if (!isMap(tables)) return null
    const columns = {}
    for (const [path, cols] of Object.entries(tables)) {
      if (!isMap(cols)) continue
      const kept = {}
      for (const [name, col] of Object.entries(cols)) {
        if (!col || typeof col !== 'object') continue
        const c = {}
        if (TYPES.has(col.type)) c.type = col.type
        const colors = Object.entries(col.colors ?? {}).filter(([, n]) => Number.isInteger(n) && n >= 0 && n < PROPERTY_COLORS)
        if (colors.length) c.colors = Object.fromEntries(colors)
        if (Object.keys(c).length) kept[name] = c
      }
      if (Object.keys(kept).length) columns[path] = kept
    }
    const sorts = {}
    for (const [path, byHeader] of Object.entries(isMap(data?.sorts) ? data.sorts : {})) {
      if (!isMap(byHeader)) continue
      const kept = Object.fromEntries(Object.entries(byHeader).filter(([, v]) => typeof v?.col === 'string' && DIRS.has(v.dir)).map(([h, v]) => [h, { col: v.col, dir: v.dir }]))
      if (Object.keys(kept).length) sorts[path] = kept
    }
    return { columns, sorts }
  } catch {
    return null
  }
}

const isMap = v => Boolean(v) && typeof v === 'object' && !Array.isArray(v)
const DIRS = new Set(['asc', 'desc'])
const sorted = obj => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))
export const serializeTables = ({ columns, sorts }) =>
  JSON.stringify(Object.keys(sorts).length ? { tables: sorted(columns), sorts: sorted(sorts) } : { tables: sorted(columns) }, null, 2) + '\n'

// `settings` with `edit(column settings) => settings` applied to `path`'s column `name`; empty ones are dropped
function withColumn(settings, path, name, edit) {
  const { columns: tables } = settings
  const col = edit({ ...tables[path]?.[name] })
  const columns = { ...tables[path], [name]: col }
  if (!col.type) delete col.type
  if (col.colors && !Object.keys(col.colors).length) delete col.colors
  if (!Object.keys(col).length) delete columns[name]
  const out = { ...tables, [path]: columns }
  if (!Object.keys(columns).length) delete out[path]
  return { ...settings, columns: out }
}

// `type` picked for the column (null: back to the one its cells look like)
export const withColumnType = (settings, path, name, type) => withColumn(settings, path, name, c => ({ ...c, type: type ?? undefined }))

// `color` picked for one of the column's values
export const withValueColor = (settings, path, name, value, color) =>
  withColumn(settings, path, name, c => ({ ...c, colors: { ...c.colors, [value]: color } }))

// A table of a note is told apart from the note's others by its header row: its column names (a `|` in one escaped, so
// names never run together)
export const headerKey = names => names.map(n => n.replace(/\|/g, '\\|')).join(' | ')

// Each of a note's tables' keys (`headers`: each table's column names, null for one left out): its headerKey, and for a
// second or later table with the same header ' #2', ' #3'…, so tables alike keep sorts of their own
export function tableKeys(headers) {
  const seen = {}
  return headers.map(names => {
    if (!names) return null
    const key = headerKey(names)
    seen[key] = (seen[key] ?? 0) + 1
    return seen[key] > 1 ? `${key} #${seen[key]}` : key
  })
}

// How a table (`header`: headerKey) is sorted: { col: a column's name, dir } (Sort in its column's menu), or null for
// Manual, its rows in the note's order. A table whose header no longer has that column shows Manual
export const sortOf = (settings, path, header) => settings?.sorts[path]?.[header] ?? null
export function withTableSort(settings, path, header, sort) {
  const byHeader = { ...settings.sorts[path], [header]: sort ?? undefined }
  if (!sort) delete byHeader[header]
  const sorts = { ...settings.sorts, [path]: byHeader }
  if (!Object.keys(byHeader).length) delete sorts[path]
  return { ...settings, sorts }
}

// The settings follow their note when it moves, and go with it when it's deleted
export const movedTables = (s, from, to, isDir) => ({ columns: movedMap(s.columns, from, to, isDir), sorts: movedMap(s.sorts, from, to, isDir) })
export const removedTables = (s, path, isDir) => ({ columns: removedMap(s.columns, path, isDir), sorts: removedMap(s.sorts, path, isDir) })

// --- Values ---

const CHECKED = new Set(['x', '✓', '✔', '☑', 'yes', 'true', '[x]', 'y'])
const UNCHECKED = new Set(['', 'no', 'false', '[ ]', '☐', 'n'])
export const isChecked = text => CHECKED.has(text.trim().toLowerCase())

// A cell's number: "1,234.5", "12%", "$40", "3,5" (a decimal comma); null when it isn't one
export function parseNumber(text) {
  let t = text.trim().replace(/^[$€£¥]\s*|\s*[$€£¥%]$/g, '').replace(/\s/g, '')
  if (/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, '')
  else if (/^[-+]?\d+,\d+$/.test(t)) t = t.replace(',', '.')
  return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : null
}

// A multi-select cell's values: its text split at commas
export const cellValues = text => text.split(',').map(v => v.trim()).filter(Boolean)

// A cell's value for its type: text (text, link, select), a list (multi), a number or null, a date or null, true / false
export function cellValue(type, text) {
  switch (type) {
    case 'multi': return cellValues(text)
    case 'number': return parseNumber(text)
    case 'date': return valueDate(text)
    case 'checkbox': return isChecked(text)
    default: return text.trim()
  }
}

// The text a ticked or cleared checkbox writes, in the column's own words (yes / no, true / false, [x] / [ ], or a mark
// and nothing)
export function checkboxText(texts, checked) {
  const used = texts.map(t => t.trim().toLowerCase())
  const pair = [['yes', 'no'], ['true', 'false'], ['[x]', '[ ]'], ['y', 'n']].find(p => used.some(u => p.includes(u)))
  if (pair) return checked ? pair[0] : pair[1]
  return checked ? (texts.map(t => t.trim()).find(t => CHECKED.has(t.toLowerCase())) || 'x') : ''
}

// A value short enough to be a choice: up to 40 characters and 5 words
const short = v => v.length <= 40 && v.split(/\s+/).length <= 5

// The type a column's cells (`cells`: [{ text, link }], `link` when the cell is only a link) look like
export function detectType(cells) {
  const filled = cells.filter(c => c.text.trim())
  if (!filled.length) return 'text'
  const texts = filled.map(c => c.text.trim())
  if (texts.every(t => CHECKED.has(t.toLowerCase()) || UNCHECKED.has(t.toLowerCase())) && texts.some(t => CHECKED.has(t.toLowerCase()))) return 'checkbox'
  if (texts.every(t => parseNumber(t) !== null)) return 'number'
  if (texts.every(t => valueDate(t))) return 'date'
  if (filled.every(c => c.link)) return 'link'
  if (filled.length < 2) return 'text'
  if (texts.some(t => t.includes(','))) {
    const lists = texts.map(cellValues)
    const all = lists.flat()
    if (all.every(short) && new Set(all).size < all.length) return 'multi'
    return 'text'
  }
  return texts.every(short) && new Set(texts).size < texts.length ? 'select' : 'text'
}

// The values a select or multi-select column has, A–Z
export const columnValues = (type, texts) =>
  [...new Set(texts.flatMap(t => type === 'multi' ? cellValues(t) : [t.trim()]).filter(Boolean))].sort((a, b) => a.localeCompare(b))

// --- Sorting and filtering (while the note is open, never saved) ---

const dateKey = d => d ? ((d.year * 100 + d.month) * 100 + d.day) * 10000 + (d.hour ?? 0) * 100 + (d.minute ?? 0) : null

// How a column of `type` sorts: [label of ascending, label of descending]
export const SORT_LABELS = {
  text: ['A–Z', 'Z–A'], link: ['A–Z', 'Z–A'], select: ['A–Z', 'Z–A'], multi: ['A–Z', 'Z–A'],
  number: ['1–9', '9–1'], date: ['Oldest', 'Newest'], checkbox: ['Open first', 'Done first'],
}

// The rows' order (indexes into `texts`, each row's cell in the column) sorted by the column, `dir` 'asc' or 'desc';
// empty cells last either way, ties keep their order
export function sortedRows(type, texts, dir) {
  const key = text => {
    const v = cellValue(type, text)
    if (type === 'number') return v
    if (type === 'date') return dateKey(v)
    if (type === 'checkbox') return v ? 1 : 0
    if (type === 'multi') return v.length ? v.join(', ') : null
    return v || null
  }
  const keys = texts.map(key)
  const sign = dir === 'desc' ? -1 : 1
  return texts.map((_, i) => i).sort((a, b) => {
    const [x, y] = [keys[a], keys[b]]
    if (x === null || y === null) return (x === null) - (y === null) || a - b
    const c = typeof x === 'string' ? x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' }) : x - y
    return sign * c || a - b
  })
}

// Whether a cell (`text`) passes its column's `filter`: select / multi-select { values: [...] } (one of them),
// number { min, max } (as typed), date { from, to } (days, ends included), checkbox 'done' | 'open'; text and links have none
export function cellPasses(type, text, filter) {
  if (filter === undefined || filter === null) return true
  const v = cellValue(type, text)
  switch (type) {
    case 'select': return !filter.values?.length || filter.values.includes(v)
    case 'multi': return !filter.values?.length || filter.values.some(x => v.includes(x))
    case 'number': {
      const [min, max] = [bound(filter.min), bound(filter.max)]
      if (min === null && max === null) return true
      return v !== null && (min === null || v >= min) && (max === null || v <= max)
    }
    case 'date': {
      if (!filter.from && !filter.to) return true
      const day = v && dateKey({ ...v, hour: 0, minute: 0 })
      return day !== null && (!filter.from || day >= dateKey({ ...filter.from, hour: 0, minute: 0 })) && (!filter.to || day <= dateKey({ ...filter.to, hour: 0, minute: 0 }))
    }
    case 'checkbox': return filter === 'done' ? v : filter === 'open' ? !v : true
    default: return true
  }
}

// A number filter's bound as typed ('' or anything not a number: none)
const bound = v => v == null || String(v).trim() === '' || isNaN(Number(v)) ? null : Number(v)

// Whether a filter filters anything
export const isFiltering = filter => filter != null && (typeof filter === 'string'
  || !!filter.values?.length || bound(filter.min) !== null || bound(filter.max) !== null || !!filter.from || !!filter.to)

// --- The table's markdown ---

// A table line's cells: [{ start, end }] (offsets in the line, the text between its pipes, spaces included). Only an
// escaped pipe (\|) doesn't split: as on GitHub, one inside `code` does too.
function lineCells(line) {
  const pipes = []
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\\') i++
    else if (line[i] === '|') pipes.push(i)
  }
  const lead = line.trimStart().startsWith('|') ? pipes.shift() : -1
  const cells = []
  let from = lead + 1
  for (const p of pipes) { cells.push({ start: from, end: p }); from = p + 1 }
  if (line.slice(from).trim()) cells.push({ start: from, end: line.length })
  return { cells, closed: !line.slice(from).trim() && pipes.length > 0 }
}

// A table's markdown (`raw`: one block, the table alone) as its body rows: [{ start, end, cells: [{ start, end }] }]
// with offsets in `raw`; null when it isn't a plain table (one in a quote or a list)
export function tableRows(raw) {
  const lines = []
  let at = 0
  for (const line of raw.split('\n')) { lines.push({ line: line.replace(/\r$/, ''), at }); at += line.length + 1 }
  const table = lines.filter(l => l.line.trim())
  if (table.length < 2 || !/^ {0,3}\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(table[1].line) || !table[0].line.includes('|')) return null
  return table.slice(2).map(({ line, at }) => {
    const { cells, closed } = lineCells(line)
    return { start: at, end: at + line.length, closed, cells: cells.map(c => ({ start: at + c.start, end: at + c.end })) }
  })
}

// `raw` (one table) with body row `from` moved before body row `at` (rows.length: after the last); the header and its
// divider never move, and nothing changes when `raw` isn't a plain table
// `order` (a table's body rows as shown: indexes in the note's order) with row `from` moved next to row `to`, after it
// with `after`
export function movedInOrder(order, from, to, after) {
  if (from === to) return order
  const out = order.filter(r => r !== from)
  out.splice(out.indexOf(to) + (after ? 1 : 0), 0, from)
  return out
}

// `raw` with its body rows in `order` (order[i]: the row that goes at i), never above the header, keeping the line
// breaks between them
export function reorderTableRows(raw, order) {
  const rows = tableRows(raw)
  if (!rows || order.length !== rows.length) return raw
  const lines = rows.map(r => raw.slice(r.start, r.end))
  const breaks = rows.slice(0, -1).map((r, i) => raw.slice(r.end, rows[i + 1].start))
  return raw.slice(0, rows[0].start) + order.map((r, i) => lines[r] + (breaks[i] ?? '')).join('') + raw.slice(rows.at(-1).end)
}

// The order that puts back rows reordered by `order` (reorderTableRows)
export const undoneOrder = order => order.reduce((back, r, i) => { back[r] = i; return back }, [])

const escapeCell = text => text.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|')

// `raw` with cells written: `edits` [{ row, col, text }] (body rows); a row too short gets the cells it lacks
export function withCells(raw, edits) {
  const rows = tableRows(raw)
  if (!rows) return raw
  let out = raw
  // From the end, so the offsets before stay right
  const byRow = {}
  for (const e of edits) if (rows[e.row]) (byRow[e.row] ||= []).push(e)
  for (const r of Object.keys(byRow).map(Number).sort((a, b) => b - a)) {
    const row = rows[r]
    let line = raw.slice(row.start, row.end)
    const cells = row.cells.map(c => ({ start: c.start - row.start, end: c.end - row.start }))
    const add = Math.max(...byRow[r].map(e => e.col)) + 1 - cells.length
    if (add > 0) {
      if (!row.closed) line += ' |'
      for (let i = 0; i < add; i++) { cells.push({ start: line.length, end: line.length + 2 }); line += '  |' }
    }
    for (const e of [...byRow[r]].sort((a, b) => b.col - a.col)) {
      const c = cells[e.col]
      line = line.slice(0, c.start) + ` ${escapeCell(e.text)} ` + line.slice(c.end)
    }
    out = out.slice(0, row.start) + line + out.slice(row.end)
  }
  return out
}
