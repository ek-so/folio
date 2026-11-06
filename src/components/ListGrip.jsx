import { useEffect, useLayoutEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVertical } from '@phosphor-icons/react'

// The drag handle of a list item in the note preview, rendered into its `.list-grip` spot (in the
// gutter left of the item, MarkdownPreview). The item itself (the spot's <li>, HTML the preview
// rendered) is what moves, up and down only.
export default function ListGrip({ spot, id, list }) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id, data: { list } })
  const item = spot.parentElement
  useEffect(() => { setNodeRef(item) }, [item, setNodeRef])
  useLayoutEffect(() => {
    item.style.transform = transform ? CSS.Translate.toString({ ...transform, x: 0 }) : ''
    item.style.transition = transition ?? ''
    item.classList.toggle('list-dragging', isDragging)
  }, [item, transform, transition, isDragging])
  return (
    <span ref={setActivatorNodeRef} aria-label="Drag to move" className="flex size-full cursor-grab touch-manipulation items-center justify-center rounded-sm text-muted-foreground hover:bg-secondary" {...attributes} {...listeners}>
      <DotsSixVertical className="size-4" />
    </span>
  )
}
