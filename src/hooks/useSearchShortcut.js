import { useEffect, useRef } from 'react'
import { isSearchShortcut, IS_MAC } from '../lib/shortcuts.js'

const MODAL = '[data-slot="dialog-content"], [data-slot="sheet-content"]' // an open dialog or sheet

// ⌘K / Ctrl+K anywhere (lib/shortcuts.js) calls `onSearch`, in place of the browser's own use of it; not while a dialog or
// sheet is open (Search itself too), so it never opens over one
export function useSearchShortcut(onSearch) {
  const latest = useRef(onSearch)
  latest.current = onSearch
  useEffect(() => {
    const onKey = e => {
      if (!isSearchShortcut(e, IS_MAC)) return
      e.preventDefault()
      if (!document.querySelector(MODAL)) latest.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
