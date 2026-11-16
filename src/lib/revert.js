// Undo of an update (a commit) from Recent updates. It doesn't touch GitHub's history: it makes local changes like any
// other, synced as a new update, which can itself be undone (that puts the first one back). Each file the update changed
// goes back to how it was before it, keeping whatever changed since:
//   Changed by the update: the update's change is taken out of the text as it is now (`mergeText`, lib/merge.js); what
//   changed since stays, and where both changed the same lines both are kept. A file that isn't text (an image) changed
//   since stays, and its version from before the update goes next to it as "name (before).ext".
//   Added: removed, unless it changed since (then it stays).
//   Removed: made again (a taken name gets a number).
//   Renamed: moved back (a taken name gets a number).
//   Gone since (removed or moved after the update): left as it is.
import { virtualFiles, add, upload, setEdit, replaceUpload, remove, rename, freePath, freeTarget, splitName } from './changes.js'
import { mergeText } from './merge.js'

// The commit's file `f` (github.js `commitFiles`) as where it was before and after: { before, after } paths, null where
// there was none (added; removed)
export const sides = f => ({
  before: f.status === 'added' || f.status === 'copied' ? null : f.from ?? f.path,
  after: f.status === 'removed' ? null : f.path,
})

// `path` with " (before)" before its extension
const beside = path => {
  const slash = path.lastIndexOf('/') + 1
  const [name, ext] = splitName(path.slice(slash))
  return `${path.slice(0, slash)}${name} (before)${ext}`
}

// A file's text as it is now in `ch` (`entry` from virtualFiles), undefined when it isn't text
const textNow = (ch, entry, text) => ch.edits[entry.orig] ?? text(entry.sha)

// `ch` with the file `entry` holding `content` (its upload, if any, dropped)
function withText(ch, files, entry, content, text) {
  const uploads = { ...ch.uploads }
  delete uploads[entry.orig]
  const base = files[entry.orig]?.sha
  return setEdit({ ...ch, uploads }, entry, content, base === undefined ? '' : text(base) ?? '')
}

// A file as it was before the update (`sha`) made again at `path`: text as an edit, other files as their bytes (which
// this device must have)
const made = (ch, files, path, sha, text) => text(sha) !== undefined ? add(ch, files, path, text(sha)) : upload(ch, files, path, sha)

// `ch` with the update undone, as described on top. `steps`: one per file it changed, { before, after }, each
// { path, sha } or null; `files`: GitHub's files now; `text(sha)`: a blob's text when it's a text file (a note, the app's
// settings), else undefined. { changes, kept: paths where what changed since was kept beside the undo, left: paths gone since }
export function reverted(ch, files, steps, text) {
  let next = ch
  const kept = [], left = []
  for (const { before, after } of steps) {
    const view = virtualFiles(files, next)
    if (!after) { // removed by the update: made again
      const there = view[before.path]
      if (!there || there.sha !== before.sha || there.orig in next.edits) next = made(next, files, freePath(next, view, before.path), before.sha, text)
      continue
    }
    const now = view[after.path]
    if (!now) { left.push(after.path); continue }
    const nowText = textNow(next, now, text)
    const unchanged = nowText !== undefined && text(after.sha) !== undefined
      ? nowText === text(after.sha)
      : now.sha === after.sha && !(now.orig in next.edits)
    if (!before) { // added by the update: removed
      if (unchanged) next = remove(next, view, after.path, false)
      else kept.push(after.path)
      continue
    }
    let path = after.path
    if (before.path !== after.path) { // renamed: back to its old place
      path = freeTarget(next, view, { path: after.path, type: 'file' }, before.path)
      next = rename(next, view, after.path, path, false)
    }
    if (before.sha === after.sha) continue
    const entry = virtualFiles(files, next)[path]
    if (nowText !== undefined && text(before.sha) !== undefined && text(after.sha) !== undefined) {
      const merged = mergeText(text(after.sha), nowText, text(before.sha))
      if (merged.clashed) kept.push(path)
      next = withText(next, files, entry, merged.text, text)
    } else if (unchanged) next = replaceUpload(next, entry, before.sha)
    else {
      kept.push(path)
      next = made(next, files, freePath(next, virtualFiles(files, next), beside(path)), before.sha, text)
    }
  }
  return { changes: next, kept, left }
}
