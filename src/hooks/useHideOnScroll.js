import { useEffect, useRef, useState } from 'react'

const SHOW_ABOVE = 56 // always shown near the top of the content
const STEP = 8 // scrolled this far in one direction before it switches
const SETTLE_MS = 300 // the bar's slide resizes the content: its scroll events aren't the user's

// True while the phone top bar should be hidden: scrolling down inside `host`
// (any scroll area in it) hides it, scrolling up shows it. `resetKey` (the
// open page, file or folder) shows it again, since a new view starts on top.
export function useHideOnScroll(host, resetKey) {
  const [hidden, setHidden] = useState(false)
  const shown = useRef(true) // what the effect below last decided
  useEffect(() => { shown.current = true; setHidden(false) }, [resetKey])
  useEffect(() => {
    let last = { target: null, top: 0 }
    let settleUntil = 0
    const set = hide => {
      if (hide === !shown.current) return
      shown.current = !hide
      settleUntil = Date.now() + SETTLE_MS
      last = { target: null, top: 0 }
      setHidden(hide)
    }
    const onScroll = e => {
      const el = e.target
      if (!(el instanceof HTMLElement) || !host.current?.contains(el)) return
      // only vertical scrolling counts (a table or code block scrolling sideways doesn't)
      if (el.scrollHeight - el.clientHeight <= 1 || Date.now() < settleUntil) return
      // iOS bounce reports positions outside the real range
      const top = Math.max(0, Math.min(el.scrollTop, el.scrollHeight - el.clientHeight))
      if (last.target !== el) last = { target: el, top }
      const delta = top - last.top
      if (top < SHOW_ABOVE) set(false)
      else if (delta >= STEP) set(true)
      else if (delta <= -STEP) set(false)
      if (Math.abs(delta) >= STEP) last.top = top
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', onScroll, { capture: true })
  }, [host])
  return hidden
}
