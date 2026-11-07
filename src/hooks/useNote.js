import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { getBlob } from '../lib/github.js'
import { withFixedDates } from '../lib/markdown.js'
import { withKeys, withKeysFirst } from '../lib/frontmatter.js'

const SAVE_DELAY_MS = 400

// GitHub's version of a note; '' for one created on this device
const fetchOriginal = sha => sha === null ? Promise.resolve('') : getBlob(sha)

// A note's text and GitHub's version of it. Typing is reported through
// onEdit(content, original) after a pause, on close, before a reload and
// before Sync. Mount once per note. `beginEdit()` and `endEdit()` frame a time in the editor: when it
// ends, or the note closes before it does, every date in the note is written in one form
// (`withFixedDates`) and, when the text was changed, the properties `required` (a planner's date and repeat) it lacks come back, empty
// (put in `order`, a planner's: description, date, repeat on top);
// closing the tab saves the typing as it is.
export function useNote(entry, edited, onEdit, required, order) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const originalRef = useRef(null)
  const pendingRef = useRef(null)
  const onEditRef = useRef(onEdit)
  const latestRef = useRef(null) // the text as shown
  const editingRef = useRef(false)
  const startRef = useRef(null) // the text when editing began
  const shaRef = useRef(entry.sha)
  const requiredRef = useRef(required)
  requiredRef.current = required
  const orderRef = useRef(order)
  orderRef.current = order

  useEffect(() => { onEditRef.current = onEdit }, [onEdit])

  function show(value) {
    latestRef.current = value
    setContent(value)
  }

  function flush() {
    if (pendingRef.current === null || originalRef.current === null) return
    onEditRef.current(pendingRef.current, originalRef.current)
    pendingRef.current = null
  }

  useEffect(() => {
    fetchOriginal(entry.sha).then(original => {
      originalRef.current = original
      show(edited ?? original)
    }).catch(() => {
      // Without GitHub's version edits can't be tracked, so don't allow any
      setLoadError(true)
    }).finally(() => setLoading(false))

    window.addEventListener('pagehide', flush)
    window.addEventListener('folio:flush', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('folio:flush', flush)
      const done = fixed()
      if (done !== latestRef.current) pendingRef.current = done
      flush()
    }
  }, [])

  useEffect(() => {
    if (pendingRef.current === null) return
    const timer = setTimeout(flush, SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [content])

  // The file changed on GitHub (e.g. after Sync): compare edits against the
  // new version, and show it if nothing is edited locally
  useEffect(() => {
    if (entry.sha === shaRef.current) return
    shaRef.current = entry.sha
    const hasEdit = edited !== undefined
    fetchOriginal(entry.sha).then(original => {
      originalRef.current = original
      if (!hasEdit && pendingRef.current === null) show(original)
    }).catch(() => setLoadError(true)) // same as the first load: no editing without GitHub's version
  }, [entry.sha])

  function change(value) {
    pendingRef.current = value
    show(value)
  }

  // The text with its dates written in one form and its required properties back, after editing. If that fails, the text as typed
  // (saved as it is) and a message: leaving the editor must never get stuck on it
  function fixed() {
    const latest = latestRef.current
    if (!editingRef.current || latest === null) return latest
    try {
      const dated = withFixedDates(latest)
      if (!requiredRef.current?.length || latest === startRef.current) return dated
      const kept = withKeys(dated, requiredRef.current)
      return kept !== dated && orderRef.current?.length ? withKeysFirst(kept, orderRef.current) : kept
    } catch (error) {
      console.error(error)
      toast.error("The dates couldn't be formatted. The note is saved as typed.")
      return latest
    }
  }

  function beginEdit() {
    editingRef.current = true
    startRef.current = latestRef.current
  }

  function endEdit() {
    const done = fixed()
    editingRef.current = false
    if (done !== latestRef.current) change(done)
  }

  return { content, change, loading, loadError, beginEdit, endEdit }
}
