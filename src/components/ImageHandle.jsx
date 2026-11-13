import { useRef } from 'react'
import { DotsSixVertical } from '@phosphor-icons/react'

// Custom, because shadcn has no resize handle: the grip on an image's right edge in the note preview (rendered into its
// `.image-handle` spot, inside the `.image-frame` around the <img>: MarkdownPreview). Drag it sideways to resize the image
// live (the picture itself changes while dragging); on release `onResize(width)` writes the width into the note. The arrow
// keys do it 16px at a time. Shown while the image is hovered or focused, always on touch screens.
const MIN = 48
const STEP = 16

export default function ImageHandle({ spot, onResize }) {
  const drag = useRef(null)
  const frame = () => spot.parentElement
  const img = () => frame().querySelector('img')
  // Widest it can be: the width of what holds the image
  const max = () => Math.floor(frame().parentElement.getBoundingClientRect().width)
  const clamp = w => Math.round(Math.min(Math.max(w, MIN), Math.max(max(), MIN)))

  const down = e => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, width: img().getBoundingClientRect().width }
  }
  const move = e => {
    if (!drag.current) return
    img().style.width = `${clamp(drag.current.width + e.clientX - drag.current.x)}px`
  }
  const up = e => {
    if (!drag.current) return
    const width = clamp(drag.current.width + e.clientX - drag.current.x)
    const moved = width !== Math.round(drag.current.width)
    drag.current = null
    if (moved) onResize(width)
  }
  const key = e => {
    const delta = e.key === 'ArrowRight' ? STEP : e.key === 'ArrowLeft' ? -STEP : 0
    if (!delta) return
    e.preventDefault()
    const width = clamp(img().getBoundingClientRect().width + delta)
    img().style.width = `${width}px`
    onResize(width)
  }

  return (
    <span
      role="slider" tabIndex={0} aria-label="Resize image" aria-orientation="horizontal" aria-valuemin={MIN}
      className="flex h-control-md w-control-sm cursor-ew-resize touch-none items-center justify-center rounded-full bg-card text-muted-foreground shadow-md ring-1 ring-border outline-none transition-opacity hover:text-foreground focus-visible:ring-ring [.image-frame:hover_&]:opacity-100 opacity-0 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}
    >
      <DotsSixVertical className="size-4" />
    </span>
  )
}
