import { virtualFiles, setEdit } from '@/lib/changes.js'
import { withKeys } from '@/lib/frontmatter.js'
import { SYMLINK_MODE } from '@/lib/links.js'

// A board widget (Kanban): a folder whose direct subfolders are its columns
// and whose files are its cards (a column holds every file inside its folder,
// at any depth). Files right in the board's folder are "No status", a column
// shown only while there are any. Moving a card to another column moves its
// file there. Each board's settings live in the repo, beside the views:
// `.folio/boards/<id>.json`,
//   { "folder", "properties": [keys shown on cards], "hidden": [column names not shown],
//     "columns": [column names, in order], "cards": { column name: [card keys, in order] } }
// A card's key is its path inside its column ('' for No status: inside the board's folder).
// What isn't in the saved order follows it, by name.

export const boardPath = id => `.folio/boards/${id}.json`
export const LOOSE = '' // the No status column's key in `cards`

const strings = list => Array.isArray(list) ? list.filter(s => typeof s === 'string') : []

// The board a file's text holds, or null when it can't be read as one
export function parseBoard(text) {
  try {
    const data = JSON.parse(text)
    if (typeof data?.folder !== 'string') return null
    const cards = {}
    for (const [k, v] of Object.entries(data.cards ?? {})) cards[k] = strings(v)
    return { folder: data.folder, properties: strings(data.properties), hidden: strings(data.hidden), columns: strings(data.columns), cards }
  } catch {
    return null
  }
}

export const serializeBoard = board => JSON.stringify(board, null, 2) + '\n'

export const newBoard = folder => ({ folder, properties: [], hidden: [], columns: [], cards: {} })

const nameOf = path => path.slice(path.lastIndexOf('/') + 1)
// Technical files and folders (".assets", "_attachments", ".gitkeep"…): a name starting with "." or "_"
// anywhere in the path keeps it off the board
const technical = part => /^[._]/.test(part)
export const isTechnical = rest => rest.split('/').some(technical)

// `items` in the saved order (`saved`: keys), then the rest by name
function ordered(items, saved = []) {
  const at = new Map(saved.map((k, i) => [k, i]))
  return [...items].sort((a, b) =>
    (at.get(a.key) ?? Infinity) - (at.get(b.key) ?? Infinity) || nameOf(a.path).localeCompare(nameOf(b.path)))
}

// What the board shows, from `files` (paths of the repo's files): `columns`
// [{ name, path, cards: [{ key, path }] }] in order (technical folders and files left out), `loose` (No status) the
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
    if (slash === -1) { if (!isTechnical(rest)) loose.push({ key: rest, path }); continue }
    const name = rest.slice(0, slash)
    if (isTechnical(name)) continue
    if (!folders.has(name)) folders.set(name, { key: name, name, path: prefix + name, cards: [] })
    const key = rest.slice(slash + 1)
    if (!isTechnical(key)) folders.get(name).cards.push({ key, path })
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
    const follow = c => c === was[0] ? now[0] : c
    return { ...board, columns: board.columns.map(follow), hidden: board.hidden.map(follow), cards }
  }
  if (now[0] !== was[0]) return board
  const follow = k => k === was[1] || k.startsWith(was[1] + '/') ? now[1] + k.slice(was[1].length) : k
  return { ...board, cards: { ...board.cards, [was[0]]: (board.cards[was[0]] ?? []).map(follow) } }
}

// `ch` with `edit(text)` applied to the note at `path` (in `ch`'s files); `remoteText(sha)`: GitHub's text of
// a note (undefined when it isn't on this device: that note is left as it is)
export function editNote(ch, files, path, edit, remoteText) {
  const entry = virtualFiles(files, ch)[path]
  if (!entry) return ch
  const original = remoteText(entry.sha)
  const text = ch.edits[entry.orig] ?? original
  if (text === undefined) return ch
  const edited = edit(text)
  return edited === text ? ch : setEdit(ch, entry, edited, original ?? '')
}

// `ch` with `edit(text)` applied to every note of the board in `folder` (in `ch`'s files):
// technical files and symlinks (whose text is the path they point to) are left alone.
export function editNotes(ch, files, folder, edit, remoteText) {
  const prefix = folder ? folder + '/' : ''
  let next = ch
  for (const [path, entry] of Object.entries(virtualFiles(files, ch))) {
    if (!path.startsWith(prefix) || !path.endsWith('.md') || entry.mode === SYMLINK_MODE || isTechnical(path.slice(prefix.length))) continue
    next = editNote(next, files, path, edit, remoteText)
  }
  return next
}

// `ch` with every note in `folder` given the `keys` it lacks, empty (lib/frontmatter.js)
export const withBoardKeys = (ch, files, folder, keys, remoteText) => editNotes(ch, files, folder, t => withKeys(t, keys), remoteText)

// Where a card goes when dropped in `column` (a column's name, or LOOSE) at
// `index` among that column's other cards, from what the board shows (`data`,
// boardColumns): `board` with the new order, and `to`, the file's new path
// when it changes column (it goes right into that column's folder), else null
export function placeCard(board, data, path, column, index) {
  const all = [{ key: LOOSE, path: board.folder, cards: data.loose }, ...data.columns]
  const from = all.find(c => c.cards.some(card => card.path === path))
  const target = all.find(c => c.key === column)
  if (!from || !target) return { board, to: null }
  const card = from.cards.find(c => c.path === path)
  const same = from === target
  const key = same ? card.key : nameOf(path)
  const keys = target.cards.filter(c => c.path !== path).map(c => c.key)
  keys.splice(Math.max(0, Math.min(index, keys.length)), 0, key)
  const cards = { ...board.cards, [column]: keys }
  if (!same) cards[from.key] = from.cards.filter(c => c.path !== path).map(c => c.key)
  const to = same ? null : (target.path ? target.path + '/' : '') + key
  return { board: { ...board, cards }, to }
}

// Where each file in `column` (a column's folder: its `path`) goes when its cards move to
// No status, as [path, folder]: a card right into the board's folder, a technical file
// with its technical folder (".../_assets/x.png" -> "<board>/_assets"), so it stays off the board
export function emptyColumn(board, column, files) {
  const prefix = board.folder ? board.folder + '/' : ''
  return files.filter(p => p.startsWith(column + '/') && !p.endsWith('/.gitkeep')).map(path => {
    const parts = path.slice(column.length + 1).split('/')
    const at = parts.findIndex(technical)
    return [path, at === -1 || at === parts.length - 1 ? board.folder : prefix + parts.slice(at, -1).join('/')]
  })
}

// `board` with column `name` moved to `index` in the order the board shows (`data`)
export function moveColumn(board, data, name, index) {
  const names = data.columns.map(c => c.name).filter(n => n !== name)
  names.splice(Math.max(0, Math.min(index, names.length)), 0, name)
  return { ...board, columns: names }
}
