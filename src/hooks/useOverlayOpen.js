import { useCallback, useEffect, useState } from 'react'

// Every floating panel's (a popover's, a dropdown menu's) radix `open` / `defaultOpen` / `onOpenChange`
// as one `[open, setOpen]`, controlled or not. While open, a finger moving anywhere outside the
// open panels (a scroll or swipe) closes it: radix closes on a touch outside only once it's a tap,
// so a scroll would leave it floating.
export function useOverlayOpen({ open: controlled, defaultOpen = false, onOpenChange }) {
  const [own, setOwn] = useState(defaultOpen)
  const isControlled = controlled !== undefined
  const open = isControlled ? controlled : own
  const setOpen = useCallback(next => {
    if (!isControlled) setOwn(next)
    onOpenChange?.(next)
  }, [isControlled, onOpenChange])
  useEffect(() => {
    if (!open) return
    const onMove = e => { if (!e.target.closest?.('[data-radix-popper-content-wrapper]')) setOpen(false) }
    document.addEventListener('touchmove', onMove, { capture: true, passive: true })
    return () => document.removeEventListener('touchmove', onMove, { capture: true })
  }, [open, setOpen])
  return [open, setOpen]
}
