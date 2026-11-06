import { DotsSixVertical } from '@phosphor-icons/react'
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { ListRow } from './ui/list-row.jsx'
import BottomSheet from './BottomSheet.jsx'

// A sheet to put `items` ([{ id, icon, title }]) in order by dragging them (a view's widgets):
// with a mouse right away, on touch after holding 0.25s, like a board's cards. Each drop calls
// `onMove(from, to)` (indexes) at once; Done only closes.
export default function RearrangeModal({ title, description, items, onMove, onClose }) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )
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
              {items.map(item => <Row key={item.id} item={item} />)}
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

// One row (`ListRow`): grip, icon and title; the whole row drags
function Row({ item }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn(isDragging && 'relative z-10')}>
      <ListRow
        leading={<DotsSixVertical className="ml-2 size-4 shrink-0 text-muted-foreground" />}
        icon={item.icon}
        title={item.title}
        className={cn('cursor-grab touch-manipulation select-none [-webkit-touch-callout:none] [&_button]:cursor-grab', isDragging && 'bg-secondary shadow-md')}
        rowProps={{ ...attributes, ...listeners }}
      />
    </li>
  )
}
