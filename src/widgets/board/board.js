import { isTechnical } from '@/lib/folderNotes.js'
import { properties, valueList } from '@/lib/frontmatter.js'

// A board widget (Kanban): the files in a folder, at any depth, are its cards,
// grouped into columns by one of their properties, `group` (`status` unless
// another is picked; a column per value). Files without a value (and files
// that aren't notes) are "No status", a column shown only while there are any.
// Moving a card to another column sets that property; the file stays where it
// is. Each board's settings live in the repo, beside the views:
// `.folio/boards/<id>.json`,
//   { "folder", "group": the grouping property, "properties": [keys shown on cards],
//     "groups": { property: { "columns": [column names, in order], "hidden": [column names not shown],
//       "cards": { column name: [card keys, in order] } } } }
// so each property keeps its own columns when another is picked and back. An older file's top-level
// `columns`, `hidden` and `cards` are the status's. A card's key is its path inside the board's folder.
// What isn't in the saved order follows it, by name.
// In the app a board is { folder, group, properties, columns, hidden, cards: the group's, groups: the others' }.

export const boardPath = id => `.folio/boards/${id}.json`
export const LOOSE = '' // the No status column's key in `cards`

// The property a new board groups by. The grouping one is listed in Properties, but not shown on cards.
export const STATUS = 'status'

const strings = list => Array.isArray(list) ? list.filter(s => typeof s === 'string') : []
const layout = data => {
  const cards = {}
  for (const [k, v] of Object.entries(data?.cards ?? {})) cards[k] = strings(v)
  return { columns: strings(data?.columns), hidden: strings(data?.hidden), cards }
}

// The board a file's text holds, or null when it can't be read as one
export function parseBoard(text) {
  try {
    const data = JSON.parse(text)
    if (typeof data?.folder !== 'string') return null
    const group = typeof data.group === 'string' && data.group ? data.group : STATUS
    const groups = {}
    for (const [k, v] of Object.entries(data.groups ?? {})) groups[k] = layout(v)
    if (!data.groups) groups[STATUS] = layout(data)
    const own = groups[group] ?? layout(null)
    delete groups[group]
    return { folder: data.folder, group, properties: strings(data.properties).filter(k => k !== group), ...own, groups }
  } catch {
    return null
  }
}

export const serializeBoard = ({ folder, group, properties, columns, hidden, cards, groups }) =>
  JSON.stringify({ folder, group, properties, groups: { ...groups, [group]: { columns, hidden, cards } } }, null, 2) + '\n'

// A board's name: its folder's, or the repo's for the root
export const boardTitle = (board, repoName) => board.folder.split('/').pop() || repoName

export const newBoard = folder => ({ folder, group: STATUS, properties: [], columns: [], hidden: [], cards: {}, groups: {} })

// `board` grouped by the property `key`: its columns are the ones it had for `key` (if it was ever
// grouped by it), and `key` isn't shown on cards any more; the current group's columns are kept for later
export function groupedBy(board, key) {
  if (key === board.group) return board
  const { [key]: own = layout(null), ...rest } = board.groups
  const groups = { ...rest, [board.group]: { columns: board.columns, hidden: board.hidden, cards: board.cards } }
  return { ...board, group: key, properties: board.properties.filter(k => k !== key), ...own, groups }
}

// The name of the column of cards without a value: No status, No priority…
export const looseName = board => `No ${board.group}`

// A note's column: its first value of `group`, or LOOSE when it has none (or isn't a note on this device)
export const cardStatus = (text, group = STATUS) => text === undefined ? LOOSE : (valueList(properties(text)[group] ?? '')[0] ?? LOOSE)

const nameOf = path => path.slice(path.lastIndexOf('/') + 1)
const prefixOf = board => board.folder ? board.folder + '/' : ''

// Where `path` sits inside the board's folder, or null when it isn't one of its cards (outside it, or technical)
function keyOf(board, path) {
  const prefix = prefixOf(board)
  const rest = path.startsWith(prefix) ? path.slice(prefix.length) : ''
  return rest && !isTechnical(rest) ? rest : null
}

// Whether `path` is one of the board's cards: a file in its folder, at any depth, not a technical one
export const isCard = (board, path) => keyOf(board, path) !== null

// `items` in the saved order (`saved`: keys), then the rest by name
function ordered(items, saved = []) {
  const at = new Map(saved.map((k, i) => [k, i]))
  return [...items].sort((a, b) =>
    (at.get(a.key) ?? Infinity) - (at.get(b.key) ?? Infinity) || nameOf(a.path).localeCompare(nameOf(b.path)))
}

// What the board shows, from `files` (paths of the repo's files) and `notes` ({ path: text }):
// `columns` [{ key, name, cards: [{ key, path }] }] in order (the saved ones, even empty, then any
// other status its cards have), `loose` (No status; empty: the column isn't shown), and `missing`
// when its folder is gone
export function boardColumns(board, files, notes) {
  const groups = new Map()
  for (const path of files) {
    if (!isCard(board, path)) continue
    const status = cardStatus(notes[path], board.group)
    if (!groups.has(status)) groups.set(status, [])
    groups.get(status).push({ key: keyOf(board, path), path })
  }
  const names = [...board.columns, ...[...groups.keys()].filter(n => n !== LOOSE && !board.columns.includes(n))]
  const columns = ordered([...new Set(names)].map(name => ({ key: name, name, path: name })), board.columns)
    .map(({ key, name }) => ({ key, name, cards: ordered(groups.get(name) ?? [], board.cards[name]) }))
  const missing = board.folder !== '' && !files.some(p => p.startsWith(prefixOf(board)))
  return { columns, loose: ordered(groups.get(LOOSE) ?? [], board.cards[LOOSE]), missing }
}

// The board after the file or folder (`isDir`) at `from` moved to `to` (a
// rename or a move anywhere in the repo): its folder follows, and a card (or a
// subfolder of cards) renamed or moved inside its folder keeps its place in its column
export function movedBoard(board, from, to, isDir) {
  if (board.folder !== '' && (board.folder === from || board.folder.startsWith(from + '/'))) {
    return { ...board, folder: to + board.folder.slice(from.length) }
  }
  const [was, now] = [keyOf(board, from), keyOf(board, to)]
  if (was === null || now === null) return board
  const follow = k => k === was ? now : isDir && k.startsWith(was + '/') ? now + k.slice(was.length) : k
  const cards = Object.fromEntries(Object.entries(board.cards).map(([c, keys]) => [c, keys.map(follow)]))
  return { ...board, cards }
}

// Where a card goes when dropped in `column` (a column's name, or LOOSE) at
// `index` among that column's other cards, from what the board shows (`data`,
// boardColumns): `board` with the new order, and `status`, the note's new status
// when it changes column (LOOSE: none), else null
export function placeCard(board, data, path, column, index) {
  const all = [{ key: LOOSE, cards: data.loose }, ...data.columns]
  const from = all.find(c => c.cards.some(card => card.path === path))
  const target = all.find(c => c.key === column)
  if (!from || !target) return { board, status: null }
  const same = from === target
  const keys = target.cards.filter(c => c.path !== path).map(c => c.key)
  keys.splice(Math.max(0, Math.min(index, keys.length)), 0, from.cards.find(c => c.path === path).key)
  const cards = { ...board.cards, [column]: keys }
  if (!same) cards[from.key] = from.cards.filter(c => c.path !== path).map(c => c.key)
  return { board: { ...board, cards }, status: same ? null : column }
}

// `board` with column `name` moved to `index` in the order the board shows (`data`)
export function moveColumn(board, data, name, index) {
  const names = data.columns.map(c => c.name).filter(n => n !== name)
  names.splice(Math.max(0, Math.min(index, names.length)), 0, name)
  return { ...board, columns: names }
}

// Why `name` can't be a new column's name (or column `from`'s new one): an error message, or null
export function columnNameError(data, name, from) {
  if (!name.trim()) return 'Enter a name.'
  if (name !== from && data.columns.some(c => c.name === name)) return `There's already a column “${name}”.`
  return null
}

// `board` with a new column `name` at the end of the order the board shows (`data`)
export const addedColumn = (board, data, name) => ({ ...board, columns: [...data.columns.map(c => c.name), name] })

// `board` with column `from` named `to`: its place, hidden state and card order are kept
export function renamedColumn(board, data, from, to) {
  const follow = n => n === from ? to : n
  const cards = { ...board.cards, [to]: board.cards[from] ?? [] }
  delete cards[from]
  return { ...board, columns: data.columns.map(c => follow(c.name)), hidden: board.hidden.map(follow), cards }
}

// `board` without column `name` (its order, hidden state and card order)
export function removedColumn(board, name) {
  const cards = { ...board.cards }
  delete cards[name]
  return { ...board, columns: board.columns.filter(n => n !== name), hidden: board.hidden.filter(n => n !== name), cards }
}
