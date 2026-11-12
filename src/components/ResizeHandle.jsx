import { useRef } from 'react'
import { cn } from '@/lib/utils.js'

// Drag handle on the right edge of a desktop panel, in the 16px gap to what
// follows (also ←/→ keys, saved when let go; double click resets).
// It resizes by how far it's dragged: `size` / `limits` ({ default, min, max }) / `onResize(px, save)`: `save` is
// false while dragging and true when it ends, so it's stored once.
export default function ResizeHandle({ label, size, limits, onResize, className }) {
  const last = useRef(size)
  const start = useRef(null) // { at: the pointer's x, size } when the drag began
  const at = e => e.clientX
  const onPointerDown = e => { last.current = size; start.current = { at: at(e), size }; e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault() }
  const onPointerMove = e => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    last.current = start.current.size + at(e) - start.current.at
    onResize(last.current, false)
  }
  const onPointerUp = e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) onResize(last.current, true) }
  const steps = { ArrowLeft: -16, ArrowRight: 16 }
  const onKeyDown = e => {
    const step = steps[e.key]
    if (!step) return
    e.preventDefault()
    last.current = size + step
    onResize(last.current, false)
  }
  // Held or pressed again and again, a key saves once: when it's let go
  const onKeyUp = e => { if (steps[e.key]) onResize(last.current, true) }
  return (
    <div
      role="separator" aria-orientation="vertical" aria-label={label} tabIndex={0}
      aria-valuemin={limits.min} aria-valuemax={limits.max} aria-valuenow={size}
      className={cn('group absolute inset-y-0 -right-space z-10 flex w-space cursor-col-resize touch-none justify-center outline-none', className)}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onKeyDown={onKeyDown} onKeyUp={onKeyUp}
      onDoubleClick={() => onResize(limits.default)}
    >
      <span className="h-full w-0.5 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60 group-active:opacity-100" />
    </div>
  )
}
