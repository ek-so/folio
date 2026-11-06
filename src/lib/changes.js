import { displayName } from './files.js'

// Local changes are kept as an overlay on the remote tree, keyed by the
// file's original (remote) path so edits survive renames:
//   edits:   { origPath: content }          text (notes)
//   uploads: { origPath: blobSha }          a file added from the device; its
//                                           bytes are in the offline cache
//   moves:   { origPath: newPath | null }   null = deleted
//   base:    { origPath: blobSha | null }   remote sha when first touched;
//                                           null = created locally
// A path is in `base` only while it has an edit, upload or move (or is new).

export const empty = () => ({ edits: {}, uploads: {}, moves: {}, base: {} })

// Changes saved by an older version (before uploads) in today's shape
export const normalize = ch => ch ? { ...empty(), ...ch } : empty()

export function count(ch) {
  return Object.keys(ch.base).length
}

function touch(ch, orig, sha) {
  if (!(orig in ch.base)) ch.base[orig] = sha
}

function tidy(ch, orig) {
  if (!(orig in ch.edits) && !(orig in ch.uploads) && !(orig in ch.moves)) delete ch.base[orig]
}

const targetOf = (ch, orig) => orig in ch.moves ? ch.moves[orig] : orig

function clone(ch) {
  return { edits: { ...ch.edits }, uploads: { ...ch.uploads }, moves: { ...ch.moves }, base: { ...ch.base } }
}

// Map of virtual path -> { orig, sha, mode } as the user currently sees it.
export function virtualFiles(files, ch) {
  const result = {}
  const origs = new Set([...Object.keys(files), ...Object.keys(ch.base)])
  for (const orig of origs) {
    const target = targetOf(ch, orig)
    if (target === null) continue
    const sha = orig in ch.uploads ? ch.uploads[orig] : orig in ch.base ? ch.base[orig] : files[orig].sha
    result[target] = { orig, sha, mode: files[orig]?.mode || '100644' }
  }
  return result
}

// Paths to mark as changed: edited/moved files and every folder holding a
// change (including deletions).
export function changedPaths(ch) {
  const result = new Set()
  const addWithParents = path => {
    result.add(path)
    for (let i = path.lastIndexOf('/'); i > 0; i = path.lastIndexOf('/', i - 1)) {
      result.add(path.slice(0, i))
    }
  }
  for (const orig of Object.keys(ch.base)) {
    const target = targetOf(ch, orig)
    if (target !== null) addWithParents(target)
    if (target !== orig) {
      const slash = orig.lastIndexOf('/')
      if (slash > 0) addWithParents(orig.slice(0, slash))
    }
  }
  return result
}

// "photo.png" -> ["photo", ".png"]; names without an extension keep ext ''.
export function splitName(name) {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, '']
}

export function listDir(virtual, dir, changed = new Set()) {
  const prefix = dir ? dir + '/' : ''
  const dirs = new Map()
  const items = []
  for (const path of Object.keys(virtual)) {
    if (!path.startsWith(prefix)) continue
    const rest = path.slice(prefix.length)
    const slash = rest.indexOf('/')
    if (slash === -1) {
      items.push({ name: rest, path, type: 'file', changed: changed.has(path), sha: virtual[path]?.sha })
    } else {
      const name = rest.slice(0, slash)
      dirs.set(name, { name, path: prefix + name, type: 'dir', changed: changed.has(prefix + name) })
    }
  }
  return [...dirs.values(), ...items]
    .filter(i => i.name !== '.gitkeep')
    .sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'dir' ? -1 : 1
    })
}

export function exists(virtual, path) {
  if (path in virtual) return true
  return Object.keys(virtual).some(p => p.startsWith(path + '/'))
}

// Files under `path` (the file itself, or everything inside a folder).
function affected(virtual, path, isDir) {
  if (!isDir) return virtual[path] ? [[path, virtual[path]]] : []
  return Object.entries(virtual).filter(([p]) => p.startsWith(path + '/'))
}

// Problem with a new file or folder name, or null if it's fine.
export function nameError(name) {
  if (!name) return 'Enter a name.'
  if (name.includes('/')) return 'Name can\'t contain "/".'
  if (name === '.' || name === '..') return 'That name is reserved.'
  if (name === '.gitkeep') return 'That name is used to keep empty folders.'
  return null
}

const TAKEN = 'That name is already taken.'
const FREED = 'Sync first: a renamed or deleted item just used this name.'

// Why a file can't be placed at `path`, or null. `orig` is the file's
// original path when moving an existing file (undefined for a new one).
// A path that an unsynced rename/delete moved away from can't be reused yet:
// one commit can't both remove and add it. The exception is creating a new
// file where a deleted one was — add() turns that into an edit.
function placeError(ch, virtual, path, orig) {
  if (exists(virtual, path)) return TAKEN
  const freed = path in ch.moves && path !== orig
  if (freed && !(orig === undefined && ch.moves[path] === null)) return FREED
  return null
}

// Largest file added from the device. GitHub takes up to 100 MB, but the
// whole file is held in memory (as base64) while it's stored and uploaded,
// and phones run out well before that.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

// First free path like `path` for a new file: "photo.png", "photo 2.png", …
export function freePath(ch, virtual, path) {
  const slash = path.lastIndexOf('/') + 1
  const [base, ext] = splitName(path.slice(slash))
  let candidate = path
  for (let n = 2; createError(ch, virtual, [candidate]); n++) {
    candidate = `${path.slice(0, slash)}${base} ${n}${ext}`
  }
  return candidate
}

// Path an item gets when renamed to `name` (files keep their extension).
export function renameTarget(item, name) {
  const parent = item.path.slice(0, item.path.lastIndexOf('/') + 1)
  return parent + name + (item.type === 'dir' ? '' : splitName(item.name)[1])
}

// Why `item` can't be renamed to `to`, or null.
export function renameError(ch, virtual, item, to) {
  if (exists(virtual, to)) return TAKEN
  for (const [path, entry] of affected(virtual, item.path, item.type === 'dir')) {
    const error = placeError(ch, virtual, to + path.slice(item.path.length), entry.orig)
    if (error) return error
  }
  return null
}

// Whether `item` can be moved into `folder` ('' is the root): not where it
// already is, and a folder not into itself or anything inside it.
export function canMoveTo(item, folder) {
  const parent = item.path.includes('/') ? item.path.slice(0, item.path.lastIndexOf('/')) : ''
  if (folder === parent) return false
  return item.type !== 'dir' || (folder !== item.path && !folder.startsWith(item.path + '/'))
}

// Why new files can't be created at `paths`, or null.
export function createError(ch, virtual, paths) {
  for (const path of paths) {
    const error = placeError(ch, virtual, path)
    if (error) return error
  }
  return null
}

// Adds a file created on this device. Recreating a path that exists on
// GitHub (deleted locally) turns into an edit of that file.
export function add(ch, files, path, content) {
  const next = clone(ch)
  delete next.moves[path]
  delete next.uploads[path]
  next.edits[path] = content
  touch(next, path, files[path]?.sha ?? null)
  return next
}

// A copy of the file `entry` (from virtualFiles) at `to`: its text when edited on this device,
// else the same bytes (a blob GitHub or this device already has, so nothing is downloaded)
export function duplicate(ch, files, entry, to) {
  return entry.orig in ch.edits ? add(ch, files, to, ch.edits[entry.orig]) : upload(ch, files, to, entry.sha)
}

// Adds a file from the device whose bytes are cached under `sha`. Like add(),
// a path deleted locally that exists on GitHub becomes a replacement.
export function upload(ch, files, path, sha) {
  const next = clone(ch)
  delete next.moves[path]
  delete next.edits[path]
  next.uploads[path] = sha
  touch(next, path, files[path]?.sha ?? null)
  return next
}

// Replaces the content of an existing file (`entry` from virtualFiles) with
// a file from the device
export function replaceUpload(ch, entry, sha) {
  const next = clone(ch)
  delete next.edits[entry.orig]
  next.uploads[entry.orig] = sha
  touch(next, entry.orig, entry.sha)
  return next
}

export function setEdit(ch, entry, content, original) {
  const next = clone(ch)
  // A new file stays even when emptied; it only goes away when deleted
  if (content === original && entry.sha !== null) delete next.edits[entry.orig]
  else {
    next.edits[entry.orig] = content
    touch(next, entry.orig, entry.sha)
  }
  tidy(next, entry.orig)
  return next
}

export function rename(ch, virtual, from, to, isDir) {
  const next = clone(ch)
  for (const [path, entry] of affected(virtual, from, isDir)) {
    const target = to + path.slice(from.length)
    if (target === entry.orig) delete next.moves[entry.orig]
    else {
      next.moves[entry.orig] = target
      touch(next, entry.orig, entry.sha)
    }
    tidy(next, entry.orig)
  }
  return next
}

export function remove(ch, virtual, path, isDir) {
  const next = clone(ch)
  for (const [, entry] of affected(virtual, path, isDir)) {
    delete next.edits[entry.orig]
    delete next.uploads[entry.orig]
    if (next.base[entry.orig] === null) {
      // Never reached GitHub: just forget it
      delete next.moves[entry.orig]
      delete next.base[entry.orig]
    } else {
      next.moves[entry.orig] = null
      touch(next, entry.orig, entry.sha)
    }
  }
  return next
}

// Touched files whose remote version changed since they were touched.
export function conflicts(ch, files) {
  return Object.keys(ch.base).filter(orig => (files[orig]?.sha ?? null) !== ch.base[orig])
}

export function discard(ch, origs) {
  const next = clone(ch)
  for (const orig of origs) {
    delete next.edits[orig]
    delete next.uploads[orig]
    delete next.moves[orig]
    delete next.base[orig]
  }
  return next
}

// After `committed` was pushed and GitHub now has `files`: drop what was
// committed from `current`, keeping anything changed since the commit
// started (re-keyed to where the file now lives on GitHub).
export function settle(current, committed, files) {
  const next = clone(current)
  for (const orig of Object.keys(committed.base)) {
    if (!(orig in current.base)) continue
    const pushedTarget = targetOf(committed, orig)
    const nowTarget = targetOf(current, orig)
    const editChanged = orig in current.edits && current.edits[orig] !== committed.edits[orig]
    const uploadChanged = orig in current.uploads && current.uploads[orig] !== committed.uploads[orig]
    const moveChanged = nowTarget !== pushedTarget
    delete next.edits[orig]
    delete next.uploads[orig]
    delete next.moves[orig]
    delete next.base[orig]
    if (pushedTarget === null || (!editChanged && !uploadChanged && !moveChanged)) continue
    if (editChanged) next.edits[pushedTarget] = current.edits[orig]
    if (uploadChanged) next.uploads[pushedTarget] = current.uploads[orig]
    if (moveChanged) next.moves[pushedTarget] = nowTarget
    next.base[pushedTarget] = files[pushedTarget]?.sha ?? null
  }
  return next
}

// Tree entries (for the Git Data API) that apply all changes onto `files`.
export function treeEntries(ch, files) {
  const entries = []
  for (const orig of Object.keys(ch.base)) {
    const target = targetOf(ch, orig)
    const mode = files[orig]?.mode || '100644'
    if (target !== orig && files[orig]) {
      entries.push({ path: orig, mode, type: 'blob', sha: null })
    }
    if (target === null) continue
    if (orig in ch.edits) entries.push({ path: target, mode, type: 'blob', content: ch.edits[orig] })
    else if (orig in ch.uploads) entries.push({ path: target, mode, type: 'blob', sha: ch.uploads[orig] })
    else entries.push({ path: target, mode, type: 'blob', sha: ch.base[orig] })
  }
  return entries
}

// GitHub's files after `ch` is committed onto `files`, mirroring
// treeEntries. `editShas` maps each edited orig path to its new blob sha.
export function filesAfter(files, ch, editShas) {
  const result = { ...files }
  for (const orig of Object.keys(ch.base)) {
    if (targetOf(ch, orig) !== orig) delete result[orig]
  }
  for (const orig of Object.keys(ch.base)) {
    const target = targetOf(ch, orig)
    if (target === null) continue
    const sha = orig in ch.edits ? editShas[orig] : orig in ch.uploads ? ch.uploads[orig] : ch.base[orig]
    result[target] = { sha, mode: files[orig]?.mode || '100644' }
  }
  return result
}

export function getAllFolders(virtual) {
  const folders = new Set()
  for (const path of Object.keys(virtual)) {
    let p = path
    while (true) {
      const slash = p.lastIndexOf('/')
      if (slash <= 0) break
      p = p.slice(0, slash)
      folders.add(p)
    }
  }
  return [...folders].sort()
}

export function commitMessage(ch) {
  const lines = Object.keys(ch.base).map(orig => {
    const target = targetOf(ch, orig)
    if (target === null) return `Delete ${displayName(orig)}`
    if (ch.base[orig] === null) {
      return target.endsWith('/.gitkeep') ? `Create folder ${target.slice(0, -9)}` : `Create ${displayName(target)}`
    }
    if (target !== orig) return `Rename ${orig} → ${target}`
    if (orig in ch.uploads) return `Replace ${displayName(orig)}`
    return `Update ${displayName(orig)}`
  })
  if (lines.length === 1) return lines[0]
  return `Update ${lines.length} files\n\n${lines.map(l => `- ${l}`).join('\n')}`
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
