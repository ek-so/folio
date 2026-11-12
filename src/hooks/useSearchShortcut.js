import { useEffect, useRef } from 'react'
import { isSearchShortcut, IS_MAC } from '../lib/shortcuts.js'

// ⌘K / Ctrl+K anywhere (lib/shortcuts.js) calls `onSearch`, in place of the browser's own use of it
export function useSearchShortcut(onSearch) {
  const latest = useRef(onSearch)
  latest.current = onSearch
  useEffect(() => {
    const onKey = e => {
      if (!isSearchShortcut(e, IS_MAC)) return
      e.preventDefault()
      latest.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
