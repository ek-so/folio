import { useState, useEffect, useRef } from 'react'
import { getBlob } from '../lib/github.js'

const SAVE_DELAY_MS = 400

// GitHub's version of a note; '' for one created on this device
const fetchOriginal = sha => sha === null ? Promise.resolve('') : getBlob(sha)

// A note's text and GitHub's version of it. Typing is reported through
// onEdit(content, original) after a pause, on close, before a reload and
// before Sync. Mount once per note.
export function useNote(entry, edited, onEdit) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const originalRef = useRef(null)
  const pendingRef = useRef(null)
  const onEditRef = useRef(onEdit)
  const shaRef = useRef(entry.sha)

  useEffect(() => { onEditRef.current = onEdit }, [onEdit])

  function flush() {
    if (pendingRef.current === null || originalRef.current === null) return
    onEditRef.current(pendingRef.current, originalRef.current)
    pendingRef.current = null
  }

  useEffect(() => {
    fetchOriginal(entry.sha).then(original => {
      originalRef.current = original
      setContent(edited ?? original)
    }).catch(() => {
      // Without GitHub's version edits can't be tracked, so don't allow any
      setLoadError(true)
    }).finally(() => setLoading(false))

    window.addEventListener('pagehide', flush)
    window.addEventListener('folio:flush', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('folio:flush', flush)
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
      if (!hasEdit && pendingRef.current === null) setContent(original)
    }).catch(() => setLoadError(true)) // same as the first load: no editing without GitHub's version
  }, [entry.sha])

  function change(value) {
    pendingRef.current = value
    setContent(value)
  }

  return { content, change, loading, loadError }
}
