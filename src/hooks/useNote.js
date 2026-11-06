import { useState, useEffect, useRef } from 'react'
import { getBlob } from '../lib/github.js'
import { withFixedDates } from '../lib/markdown.js'

const SAVE_DELAY_MS = 400

// GitHub's version of a note; '' for one created on this device
const fetchOriginal = sha => sha === null ? Promise.resolve('') : getBlob(sha)

// A note's text and GitHub's version of it. Typing is reported through
// onEdit(content, original) after a pause, on close, before a reload and
// before Sync. Mount once per note. `beginEdit()` and `endEdit()` frame a time in the editor: the
// dates typed in it are written in one form (`withFixedDates`) when it ends, or when the note closes
// before it does (closing the tab saves the typing as it is).
export function useNote(entry, edited, onEdit) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const originalRef = useRef(null)
  const pendingRef = useRef(null)
  const onEditRef = useRef(onEdit)
  const latestRef = useRef(null) // the text as shown
  const baseRef = useRef(null) // the text when editing began, while editing
  const shaRef = useRef(entry.sha)

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

  // The text with the dates typed since editing began written in one form
  function fixed() {
    const latest = latestRef.current
    return baseRef.current === null || latest === null ? latest : withFixedDates(latest, baseRef.current)
  }

  function beginEdit() { baseRef.current = latestRef.current }

  function endEdit() {
    const done = fixed()
    baseRef.current = null
    if (done !== latestRef.current) change(done)
  }

  return { content, change, loading, loadError, beginEdit, endEdit }
}
