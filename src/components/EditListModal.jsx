import { DotsSixVertical, X } from '@phosphor-icons/react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { useDragSensors } from '../hooks/useDragSensors.js'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { ListRow } from './ui/list-row.jsx'
import BottomSheet from './BottomSheet.jsx'

// A sheet to edit a list of `items` ([{ id, icon, title }]; a view's widgets): drag them into
// order (with a mouse right away, on touch after holding 0.25s, like a board's cards; each drop
// calls `onMove(from, to)`, indexes, at once), remove one with its ✕ (`onRemove(item)`, confirmed
// by the caller). `empty`: the text when there's nothing.
export default function EditListModal({ title, description, items, onMove, onRemove, empty, onClose }) {
  const sensors = useDragSensors()
  const ids = items.map(i => i.id)
  const onDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) onMove(ids.indexOf(active.id), ids.indexOf(over.id))
  }
  return (
    <BottomSheet title={title} description={description} onClose={onClose} onOpenAutoFocus={e => { e.preventDefault(); e.currentTarget?.focus() }}>
      <div className="flex flex-col gap-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="-mx-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto" data-no-pull>
              {items.map(item => <Row key={item.id} item={item} onRemove={onRemove} />)}
              {!items.length && <p className="py-4 text-center text-sm text-muted-foreground">{empty}</p>}
            </ul>
          </SortableContext>
        </DndContext>
        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </BottomSheet>
  )
}

// One row (`ListRow`): grip, icon, title and trash; the whole row drags
function Row({ item, onRemove }) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn(isDragging && 'relative z-10')}>
      <ListRow
        leading={<DotsSixVertical className="ml-2 size-4 shrink-0 text-muted-foreground" />}
        icon={item.icon}
        title={item.title}
        className={cn('cursor-grab touch-manipulation select-none [-webkit-touch-callout:none] [&_button]:cursor-grab', isDragging && 'bg-secondary shadow-md')}
        rowProps={listeners}
        trailing={
          <Button variant="ghost-destructive" size="icon" aria-label={`Remove ${item.title}`} tooltip="Remove" className="size-control-md" onPointerDown={e => e.stopPropagation()} onClick={() => onRemove(item)}>
            <X />
          </Button>
        }
      />
    </li>
  )
}
