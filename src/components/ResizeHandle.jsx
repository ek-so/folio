import { useRef } from 'react'
import { cn } from '@/lib/utils.js'

// Drag handle on the right edge of a desktop panel, in the 16px gap to what
// follows (also ←/→ keys; double click resets); `vertical`: on the bottom edge, for a height (↑/↓).
// It resizes the box it sits in: `size` / `limits` ({ default, min, max }) / `onResize(px, save)`: `save` is
// false while dragging and true when it ends, so it's stored once.
export default function ResizeHandle({ label, size, limits, onResize, vertical, className }) {
  const last = useRef(size)
  const onPointerDown = e => { last.current = size; e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault() }
  const onPointerMove = e => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const box = e.currentTarget.parentElement.getBoundingClientRect()
    last.current = vertical ? e.clientY - box.top : e.clientX - box.left
    onResize(last.current, false)
  }
  const onPointerUp = e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) onResize(last.current, true) }
  const onKeyDown = e => {
    const step = (vertical ? { ArrowUp: -16, ArrowDown: 16 } : { ArrowLeft: -16, ArrowRight: 16 })[e.key]
    if (step) { e.preventDefault(); onResize(size + step) }
  }
  return (
    <div
      role="separator" aria-orientation={vertical ? 'horizontal' : 'vertical'} aria-label={label} tabIndex={0}
      aria-valuemin={limits.min} aria-valuemax={limits.max} aria-valuenow={size}
      className={cn('group absolute z-10 flex touch-none justify-center outline-none', vertical ? 'inset-x-0 -bottom-space-sm h-space-sm cursor-row-resize flex-col' : 'inset-y-0 -right-space w-space cursor-col-resize', className)}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onKeyDown={onKeyDown}
      onDoubleClick={() => onResize(limits.default)}
    >
      <span className={cn('rounded-full', vertical ? 'h-0.5 w-full' : 'h-full w-0.5', 'bg-primary opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60 group-active:opacity-100')} />
    </div>
  )
}
