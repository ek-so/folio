import { useEffect, useState } from 'react'

const SHOW_ABOVE = 56 // always shown near the top of the content
const STEP = 8 // scrolled this far in one direction before it switches

// True while the phone top bar should be hidden: scrolling down inside `host`
// (any scroll area in it) hides it, scrolling up shows it. `resetKey` (the
// open page, file or folder) shows it again, since a new view starts on top.
export function useHideOnScroll(host, resetKey) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => setHidden(false), [resetKey])
  useEffect(() => {
    let last = { target: null, top: 0 }
    const onScroll = e => {
      const el = e.target
      if (!(el instanceof HTMLElement) || !host.current?.contains(el)) return
      // iOS bounce reports positions outside the real range
      const top = Math.max(0, Math.min(el.scrollTop, el.scrollHeight - el.clientHeight))
      if (last.target !== el) last = { target: el, top }
      const delta = top - last.top
      if (top < SHOW_ABOVE) setHidden(false)
      else if (delta >= STEP) setHidden(true)
      else if (delta <= -STEP) setHidden(false)
      if (Math.abs(delta) >= STEP) last.top = top
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', onScroll, { capture: true })
  }, [host])
  return hidden
}
