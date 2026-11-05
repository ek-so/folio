import { virtualFiles, setEdit } from './changes.js'
import { withKeys } from './frontmatter.js'

// A board widget (Kanban): a folder whose direct subfolders are its columns
// and whose files are its cards (a column holds every file inside its folder,
// at any depth). Files right in the board's folder are "No status", a column
// shown only while there are any. Moving a card to another column moves its
// file there. Each board's settings live in the repo, beside the views:
// `.folio/boards/<id>.json`,
//   { "folder", "properties": [keys shown on cards],
//     "columns": [column names, in order], "cards": { column name: [card keys, in order] } }
// A card's key is its path inside its column ('' for No status: inside the board's folder).
// What isn't in the saved order follows it, by name.

export const boardPath = id => `.folio/boards/${id}.json`
export const LOOSE = '' // the No status column's key in `cards`
export const DESCRIPTION = 'description' // shown under a card's name; every board's notes get it

const strings = list => Array.isArray(list) ? list.filter(s => typeof s === 'string') : []

// The board a file's text holds, or null when it can't be read as one
export function parseBoard(text) {
  try {
    const data = JSON.parse(text)
    if (typeof data?.folder !== 'string') return null
    const cards = {}
    for (const [k, v] of Object.entries(data.cards ?? {})) cards[k] = strings(v)
    return { folder: data.folder, properties: strings(data.properties), columns: strings(data.columns), cards }
  } catch {
    return null
  }
}

export const serializeBoard = board => JSON.stringify(board, null, 2) + '\n'

export const newBoard = folder => ({ folder, properties: [], columns: [], cards: {} })

const nameOf = path => path.slice(path.lastIndexOf('/') + 1)
const isKeep = path => nameOf(path) === '.gitkeep'

// `items` in the saved order (`saved`: keys), then the rest by name
function ordered(items, saved = []) {
  const at = new Map(saved.map((k, i) => [k, i]))
  return [...items].sort((a, b) =>
    (at.get(a.key) ?? Infinity) - (at.get(b.key) ?? Infinity) || nameOf(a.path).localeCompare(nameOf(b.path)))
}

// What the board shows, from `files` (paths of the repo's files): `columns`
// [{ name, path, cards: [{ key, path }] }] in order, `loose` (No status) the
// files right in its folder (empty: the column isn't shown), and `missing`
// when its folder is gone
export function boardColumns(board, files) {
  const prefix = board.folder ? board.folder + '/' : ''
  const folders = new Map()
  const loose = []
  for (const path of files) {
    if (!path.startsWith(prefix)) continue
    const rest = path.slice(prefix.length)
    const slash = rest.indexOf('/')
    if (slash === -1) { if (!isKeep(rest)) loose.push({ key: rest, path }); continue }
    const name = rest.slice(0, slash)
    if (!folders.has(name)) folders.set(name, { key: name, name, path: prefix + name, cards: [] })
    const key = rest.slice(slash + 1)
    if (!isKeep(key)) folders.get(name).cards.push({ key, path })
  }
  const missing = board.folder !== '' && !files.some(p => p.startsWith(prefix))
  const columns = ordered([...folders.values()], board.columns)
    .map(c => ({ ...c, cards: ordered(c.cards, board.cards[c.name]) }))
  return { columns, loose: ordered(loose, board.cards[LOOSE]), missing }
}

// The board after the file or folder (`isDir`) at `from` moved to `to` (a
// rename or a move anywhere in the repo): its folder, a renamed column and
// cards renamed within their column follow, so the order is kept
export function movedBoard(board, from, to, isDir) {
  if (board.folder !== '' && (board.folder === from || board.folder.startsWith(from + '/'))) {
    return { ...board, folder: to + board.folder.slice(from.length) }
  }
  const prefix = board.folder ? board.folder + '/' : ''
  // Where a path sits on the board: [column, path inside it] ('' for the column itself), [LOOSE, name], or null
  const place = path => {
    if (!path.startsWith(prefix)) return null
    const rest = path.slice(prefix.length)
    const slash = rest.indexOf('/')
    if (slash !== -1) return [rest.slice(0, slash), rest.slice(slash + 1)]
    return isDir ? [rest, ''] : [LOOSE, rest]
  }
  const was = place(from)
  const now = place(to)
  if (!was || !now) return board
  if (was[0] !== LOOSE && was[1] === '') {
    if (now[1] !== '') return board // a column moved into another: it's a card folder now
    const cards = { ...board.cards, [now[0]]: board.cards[was[0]] ?? [] }
    delete cards[was[0]]
    return { ...board, columns: board.columns.map(c => c === was[0] ? now[0] : c), cards }
  }
  if (now[0] !== was[0]) return board
  const follow = k => k === was[1] || k.startsWith(was[1] + '/') ? now[1] + k.slice(was[1].length) : k
  return { ...board, cards: { ...board.cards, [was[0]]: (board.cards[was[0]] ?? []).map(follow) } }
}

// `ch` with every note in `folder` (in `ch`'s files) given the `keys` it lacks, empty (lib/frontmatter.js).
// `remoteText(sha)`: GitHub's text of a note (undefined when it isn't on this device: that note is left as it is).
export function withBoardKeys(ch, files, folder, keys, remoteText) {
  const prefix = folder ? folder + '/' : ''
  let next = ch
  for (const [path, entry] of Object.entries(virtualFiles(files, ch))) {
    if (!path.startsWith(prefix) || !path.endsWith('.md')) continue
    const original = remoteText(entry.sha)
    const text = ch.edits[entry.orig] ?? original
    if (text === undefined) continue
    const filled = withKeys(text, keys)
    if (filled !== text) next = setEdit(next, entry, filled, original ?? '')
  }
  return next
}
