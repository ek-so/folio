import { useState, useEffect } from 'react'

// The part of the screen the page can be seen in, with the on-screen keyboard open: { keyboard (its height, 0 when
// closed), top, height } (the visual viewport's). iOS doesn't shrink the page for the keyboard: bottom-fixed elements
// would sit behind it, and to show the caret it scrolls the whole page up, taking the top of the app off the screen.
// Only while something is typed in: a pinch-zoom shrinks the visual viewport too, with no keyboard.
// Leaving a field changes nothing until the keyboard itself goes (the viewport's resize), or KEEP_MS at most: a tap on a
// row under the field (a search result) takes the focus first, and moving the sheet down then would take the row from
// under the finger, so the tap would only close the keyboard.
const KEEP_MS = 400
export function useVisualViewport() {
  const [frame, setFrame] = useState({ keyboard: 0, top: 0, height: 0 })

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    // Layout height (clientHeight) rather than innerHeight: on iOS
    // innerHeight shrinks with the keyboard too, which would hide the gap
    const update = () => {
      const layout = document.documentElement.clientHeight
      const typing = document.activeElement?.matches('textarea, input, select, [contenteditable]:not([contenteditable=false])')
      if (!typing) return setFrame(f => f.keyboard ? { keyboard: 0, top: 0, height: 0 } : f)
      const next = { keyboard: Math.max(0, Math.round(layout - vv.height - vv.offsetTop)), top: Math.round(vv.offsetTop), height: Math.round(vv.height) }
      setFrame(f => f.keyboard === next.keyboard && f.top === next.top && f.height === next.height ? f : next)
    }
    let later
    const left = () => { clearTimeout(later); later = setTimeout(update, KEEP_MS) }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    window.addEventListener('focusin', update)
    window.addEventListener('focusout', left)
    return () => {
      clearTimeout(later)
      window.removeEventListener('focusin', update)
      window.removeEventListener('focusout', left)
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return frame
}
