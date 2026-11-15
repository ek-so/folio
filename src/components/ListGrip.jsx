import { useEffect, useLayoutEffect } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { DotsSixVertical } from '@phosphor-icons/react'

// The drag handle of a list item or a block in the note preview, rendered into its `.list-grip` spot (always shown, in the
// text column before the item's marker) or `.block-grip` spot (in the note's left gutter, shown on hover with a mouse):
// App.css, MarkdownPreview. Held 0.25s on touch, then dragged. The item itself (the spot's parent, an <li> or a block,
// HTML the preview rendered) stays in place, faded, while a copy of it follows the pointer up and down (MarkdownPreview's
// DragOverlay), and is what an item or block of the same kind can be dropped on: `drop` ('before' | 'after') marks it as
// the one being dropped next to, with a line in the gap on that side. Dragging it never pulls to refresh (`data-no-pull`).
export default function ListGrip({ spot, id, drop }) {
  const item = spot.parentElement
  const { setNodeRef: setDragRef, setActivatorNodeRef, attributes, listeners, isDragging } = useDraggable({ id, data: { item } })
  const { setNodeRef: setDropRef } = useDroppable({ id })
  useEffect(() => { setDragRef(item); setDropRef(item) }, [item, setDragRef, setDropRef])
  useLayoutEffect(() => { item.classList.toggle('list-dragging', isDragging) }, [item, isDragging])
  useLayoutEffect(() => {
    item.classList.toggle('list-drop-before', drop === 'before')
    item.classList.toggle('list-drop-after', drop === 'after')
  }, [item, drop])
  return (
    <span ref={setActivatorNodeRef} aria-label="Drag to move" data-no-pull className="flex size-full cursor-grab touch-manipulation items-center justify-center rounded-sm text-foreground/60 hover:bg-secondary hover:text-foreground" {...attributes} {...listeners}>
      <DotsSixVertical className="size-4" />
    </span>
  )
}
