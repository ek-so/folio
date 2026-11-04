import { useRef } from 'react'
import { cn } from '@/lib/utils.js'

// Drag handle on the right edge of a desktop panel, in the 16px gap to what
// follows (also ←/→ keys; double click resets). It resizes the panel it sits in:
// `width` / `limits` ({ default, min, max }) / `onResize(px, save)`: `save` is
// false while dragging and true when it ends, so it's stored once.
export default function ResizeHandle({ label, width, limits, onResize, className }) {
  const last = useRef(width)
  const onPointerDown = e => { last.current = width; e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault() }
  const onPointerMove = e => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    last.current = e.clientX - e.currentTarget.parentElement.getBoundingClientRect().left
    onResize(last.current, false)
  }
  const onPointerUp = e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) onResize(last.current, true) }
  const onKeyDown = e => {
    const step = { ArrowLeft: -16, ArrowRight: 16 }[e.key]
    if (step) { e.preventDefault(); onResize(width + step) }
  }
  return (
    <div
      role="separator" aria-orientation="vertical" aria-label={label} tabIndex={0}
      aria-valuemin={limits.min} aria-valuemax={limits.max} aria-valuenow={width}
      className={cn('group absolute inset-y-0 -right-space z-10 flex w-space cursor-col-resize touch-none justify-center outline-none', className)}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onKeyDown={onKeyDown}
      onDoubleClick={() => onResize(limits.default)}
    >
      <span className="h-full w-0.5 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60 group-active:opacity-100" />
    </div>
  )
}
