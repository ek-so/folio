import { useEffect, useLayoutEffect } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVertical } from '@phosphor-icons/react'

// The drag handle of a list item or a block in the note preview, rendered into its `.list-grip` spot (always shown, in the
// text column before the item's marker) or `.block-grip` spot (in the note's left gutter, shown on hover with a mouse):
// App.css, MarkdownPreview. Held 0.25s on touch, then dragged. The item itself (the spot's parent, an <li> or a block,
// HTML the preview rendered) is what moves, up and down only, and what an item or block of the same kind can be dropped
// on: `drop` ('before' | 'after') marks it as the one being dropped next to.
export default function ListGrip({ spot, id, drop }) {
  const item = spot.parentElement
  const { setNodeRef: setDragRef, setActivatorNodeRef, attributes, listeners, transform, isDragging } = useDraggable({ id, data: { item } })
  const { setNodeRef: setDropRef } = useDroppable({ id })
  useEffect(() => { setDragRef(item); setDropRef(item) }, [item, setDragRef, setDropRef])
  useLayoutEffect(() => {
    item.style.transform = transform ? CSS.Translate.toString({ ...transform, x: 0 }) : ''
    item.classList.toggle('list-dragging', isDragging)
  }, [item, transform, isDragging])
  useLayoutEffect(() => {
    item.classList.toggle('list-drop-before', drop === 'before')
    item.classList.toggle('list-drop-after', drop === 'after')
  }, [item, drop])
  return (
    <span ref={setActivatorNodeRef} aria-label="Drag to move" className="flex size-full cursor-grab touch-manipulation items-center justify-center rounded-sm text-foreground/60 hover:bg-secondary hover:text-foreground" {...attributes} {...listeners}>
      <DotsSixVertical className="size-4" />
    </span>
  )
}
