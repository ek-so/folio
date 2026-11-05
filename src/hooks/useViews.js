import { useState, useEffect } from 'react'
import { getBlob } from '../lib/github.js'
import { add, setEdit } from '../lib/changes.js'
import { VIEWS_PATH, parseViews, serializeViews } from '../lib/viewsConfig.js'

// The views in the navigation, from `.folio/views.json` in the repo (lib/viewsConfig.js):
// its local edit, else its saved copy. `ready` once that's known; until then
// (and offline without a copy on the device) nothing may be changed, so a
// config that couldn't be read is never overwritten. `save(views)` records
// the file as a local change, like any other edit (Sync commits it).
export function useViews({ remote, virtual, changes, update }) {
  const entry = virtual[VIEWS_PATH]
  const edited = entry ? changes.edits[entry.orig] : undefined
  const sha = entry?.sha ?? null
  const [copies, setCopies] = useState({}) // blob sha -> text, null if it couldn't be read

  useEffect(() => {
    if (sha === null || sha in copies) return
    let live = true
    getBlob(sha)
      .then(text => live && setCopies(c => ({ ...c, [sha]: text })))
      .catch(() => live && setCopies(c => ({ ...c, [sha]: null })))
    return () => { live = false }
  }, [sha, copies])

  const original = sha === null ? '' : copies[sha] // the saved text, which an edit is compared with
  const ready = !!remote && (!entry || (original !== undefined && original !== null))
  const text = !entry ? undefined : edited ?? original
  const views = parseViews(ready ? text : undefined)

  function save(next) {
    if (!ready) return
    const content = serializeViews(next)
    update(ch => entry ? setEdit(ch, entry, content, original) : add(ch, remote.files, VIEWS_PATH, content))
  }

  return { views, ready, save }
}
