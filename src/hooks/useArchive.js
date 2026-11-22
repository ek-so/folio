import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { archiveDay, inArchive, staleArchiveDays, KEEP_DAYS } from '../lib/archive.js'
import { remove, editNote } from '../lib/changes.js'

const today = () => { const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() } }
const folderItem = path => ({ path, name: path.slice(path.lastIndexOf('/') + 1), type: 'dir' })

// Removing files and folders (lib/archive.js): Remove moves into today's folder of `.archive/` (a taken name gets a
// number) with a toast to undo it, and something already in the archive is deleted for good, with what Folio kept about
// it. Nothing locked is removed, from anywhere: a message says so (`refusedLocked`). When the repo's files load, the
// archive's day folders older than KEEP_DAYS are removed for good, as local changes shown before Sync (each once a
// session per repo, so one put back by a discard stays until Folio opens again).
// From App: `repo` (useRepo), `repoName`, `virtual`, `update`, `filesOf(ch)`, `freeTarget(ch, item, wanted)`,
// `relocated(ch, item, to, follow)` (a move with its links rewritten), `remoteText`, and the settings that follow a file
// (`locks`, `icons`, `assets`, `tables`: each `removed(path, isDir)` as a change). Returns `lockedIn(item)`,
// `archive(item, edit)`, `unarchive(item, to, text)` and `remove(item)` (Remove in any ⋯).
export function useArchive({ repo, repoName, virtual, update, filesOf, freeTarget, relocated, remoteText, locks, icons, assets, tables }) {
  // Locked: `item` itself, or for a folder a file in it
  const lockedIn = item => locks.isLocked(item.path) || (item.type === 'dir' && Object.keys(virtual).some(p => p.startsWith(item.path + '/') && locks.isLocked(p)))
  // Whether `item` can't be removed (locked: a message says so). Every removal asks it
  function refusedLocked(item) {
    if (!lockedIn(item)) return false
    toast.error(`“${item.name}” ${item.type === 'dir' ? 'has locked files' : 'is locked'}. Unlock ${item.type === 'dir' ? 'them' : 'it'} to remove it.`)
    return true
  }

  // `item` (a file or folder) into the archive, in one step; `edit` first applied to its text (a note: a planner's done
  // card). Links to it are rewritten (so an undo puts them back); widgets and pages don't follow it: for them it's gone,
  // an open page showing it closes. { to: its path there, text: its text as it was archived, for an undo }, or null
  // when it's locked (nothing moves)
  function archive(item, edit) {
    if (refusedLocked(item)) return null
    window.dispatchEvent(new Event('folio:flush')) // typing in an open note first
    let to = item.path
    let text
    update(ch => {
      const entry = filesOf(ch)[item.path]
      text = entry && item.path.endsWith('.md') ? ch.edits[entry.orig] ?? remoteText(entry.sha) : undefined
      const from = edit ? editNote(ch, repo.remoteFiles(), item.path, edit, remoteText) : ch
      to = freeTarget(from, item, `${archiveDay(today())}/${item.name}`)
      return relocated(from, item, to, false)
    })
    return { to, text }
  }

  // An archive undone: `item` (in the archive) back at `to` (its own place, or a free name next to it if something else
  // took it since), a note with its text `text`
  function unarchive(item, to, text) {
    update(ch => {
      const back = freeTarget(ch, item, to)
      const next = relocated(ch, item, back, false)
      return text === undefined ? next : editNote(next, repo.remoteFiles(), back, () => text, remoteText)
    })
  }

  // `ch` with `item` deleted for good, and what Folio kept about it (a lock, an emoji, table columns, when it was added) with it
  function removedForGood(ch, item) {
    const isDir = item.type === 'dir'
    return tables.removed(item.path, isDir)(assets.removed(item.path, isDir)(icons.removed(item.path, isDir)(locks.removed(item.path, isDir)(remove(ch, filesOf(ch), item.path, isDir)))))
  }

  // Remove: to the archive, with a toast to undo it; already in the archive, deleted for good
  function removeItem(item) {
    if (inArchive(item.path)) {
      if (!refusedLocked(item)) update(ch => removedForGood(ch, item))
      return
    }
    const done = archive(item)
    if (!done) return
    toast.success(`“${item.name}” moved to the archive`, {
      action: { label: 'Undo', onClick: () => unarchive({ ...item, path: done.to, name: done.to.slice(done.to.lastIndexOf('/') + 1) }, item.path) },
    })
  }

  const cleaned = useRef({ repo: null, paths: new Set() })
  useEffect(() => {
    if (!repo.remote) return
    if (cleaned.current.repo !== repoName) cleaned.current = { repo: repoName, paths: new Set() }
    const done = cleaned.current.paths
    const stale = staleArchiveDays(Object.keys(virtual), today()).filter(path => !done.has(path))
    if (!stale.length) return
    stale.forEach(path => done.add(path))
    update(ch => stale.reduce((c, path) => removedForGood(c, folderItem(path)), ch))
    toast.success(`What was archived more than ${KEEP_DAYS} days ago is removed. Sync to remove it from GitHub.`)
  }, [repo.remote, repoName]) // when the repo's files load or change by Sync or Pull, not on every edit

  return { lockedIn, archive, unarchive, remove: removeItem }
}
