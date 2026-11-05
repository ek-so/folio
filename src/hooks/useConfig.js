import { useState, useEffect } from 'react'
import { getBlob } from '../lib/github.js'
import { add, setEdit, remove, virtualFiles } from '../lib/changes.js'
import { isConfigPath } from '../lib/viewsConfig.js'

// The app's settings kept in the repo: the files in `.folio/` (the views,
// lib/viewsConfig.js; each board, widgets/board/board.js). `read(path)` is { ready, text }:
// its local edit, else its saved copy (text undefined: no such file). Until a
// file is ready (and offline without a copy on the device) it must not be
// changed, so a file that couldn't be read is never overwritten; one that
// couldn't be fetched is tried again on coming online or returning to the app. `readIn(ch,
// path)` is the text a set of changes gives it (inside a change: undefined, no
// file; null, not read yet). `write(path, content)` and `erase(path)` are
// changes (ch => ch) for `update`, alone or together with other changes in one
// step; Sync commits them like any edit.
export function useConfig({ remote, virtual, changes }) {
  const [copies, setCopies] = useState({}) // blob sha -> text, null if it couldn't be read
  const shas = Object.entries(virtual).filter(([path, e]) => isConfigPath(path) && e.sha !== null).map(([, e]) => e.sha)
  const wanted = shas.filter(sha => !(sha in copies)).join()

  useEffect(() => {
    if (!wanted) return
    let live = true
    for (const sha of wanted.split(',')) {
      getBlob(sha)
        .then(text => live && setCopies(c => ({ ...c, [sha]: text })))
        .catch(() => live && setCopies(c => ({ ...c, [sha]: null })))
    }
    return () => { live = false }
  }, [wanted])

  // What couldn't be fetched (offline, a dropped connection) is fetched again
  useEffect(() => {
    const retry = () => {
      if (document.visibilityState === 'hidden') return
      setCopies(c => Object.values(c).includes(null) ? Object.fromEntries(Object.entries(c).filter(([, t]) => t !== null)) : c)
    }
    window.addEventListener('online', retry)
    document.addEventListener('visibilitychange', retry)
    return () => {
      window.removeEventListener('online', retry)
      document.removeEventListener('visibilitychange', retry)
    }
  }, [])

  // The saved text a local edit is compared with: '' for a new file; undefined (loading) or null (unreadable) until known
  const saved = entry => entry.sha === null ? '' : copies[entry.sha]

  function read(path) {
    if (!remote) return { ready: false }
    const entry = virtual[path]
    if (!entry) return { ready: true, text: undefined }
    const original = saved(entry)
    if (original === undefined || original === null) return { ready: false }
    return { ready: true, text: changes.edits[entry.orig] ?? original }
  }

  function readIn(ch, path) {
    const entry = virtualFiles(remote.files, ch)[path]
    if (!entry) return undefined
    return ch.edits[entry.orig] ?? saved(entry) ?? null
  }

  const write = (path, content) => ch => {
    const entry = virtualFiles(remote.files, ch)[path]
    return entry ? setEdit(ch, entry, content, saved(entry) ?? '') : add(ch, remote.files, path, content)
  }

  const erase = path => ch => {
    const files = virtualFiles(remote.files, ch)
    return files[path] ? remove(ch, files, path, false) : ch
  }

  return { read, readIn, write, erase }
}
