import { useState, useEffect, useRef, useMemo, createContext } from 'react'
import { getBlob } from '../lib/github.js'
import { buildIndex } from '../lib/links.js'

// { rewriteCount(item, to), linkedFrom(item) } for sheets that move files
export const LinksContext = createContext(null)

// Every note's current text (local edit, else GitHub's version from the
// offline cache) and the link index built from it: backlinks per file and
// broken links. `remoteText(sha)` is GitHub's version of a note, for
// comparing rewritten text. `missing` counts notes not on this device yet.
export function useLinkIndex(virtual, changes) {
  const textsRef = useRef(new Map()) // blob sha -> text
  const [loaded, setLoaded] = useState(0)

  useEffect(() => {
    const shas = [...new Set(Object.entries(virtual)
      .filter(([path, e]) => path.endsWith('.md') && e.sha && !textsRef.current.has(e.sha))
      .map(([, e]) => e.sha))]
    if (!shas.length) return
    let cancelled = false
    ;(async () => {
      for (const sha of shas) {
        try { textsRef.current.set(sha, await getBlob(sha)) } catch { /* not on device yet */ }
      }
      if (!cancelled) setLoaded(n => n + 1)
    })()
    return () => { cancelled = true }
  }, [virtual])

  const remoteText = sha => sha === null ? '' : textsRef.current.get(sha)

  const { notes, missing } = useMemo(() => {
    const notes = {}
    let missing = 0
    for (const [path, entry] of Object.entries(virtual)) {
      if (!path.endsWith('.md')) continue
      const text = changes.edits[entry.orig] ?? remoteText(entry.sha)
      if (text === undefined) missing++
      else notes[path] = text
    }
    return { notes, missing }
  }, [virtual, changes, loaded])

  const index = useMemo(() => buildIndex(notes, virtual), [notes, virtual])

  return { notes, index, missing, remoteText }
}
