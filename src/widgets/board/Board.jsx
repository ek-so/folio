import { useState, forwardRef } from 'react'
import { DotsThree, DotsSixVertical, Trash, Plus, Columns, PencilSimple, Tag, Folder } from '@phosphor-icons/react'
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors,
  closestCenter, closestCorners, pointerWithin,
} from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils.js'
import { Button } from '@/components/ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import PropertyBadges from '@/components/PropertyBadges.jsx'
import Spinner from '@/components/Spinner.jsx'
import RenameModal from '@/components/RenameModal.jsx'
import ColumnDeleteModal from './ColumnDeleteModal.jsx'
import CheckListModal from './CheckListModal.jsx'
import { displayName } from '@/lib/files.js'
import { frontMatter, noteTitle, DESCRIPTION } from '@/lib/frontmatter.js'
import { LOOSE } from './board.js'
import { useBoard } from './useBoard.js'

// Drag ids: a column's and a card's
const colId = key => 'col:' + key
const cardId = path => 'card:' + path
// A long press on iPhones mustn't open the text or link callout instead of the drag
const NO_CALLOUT = '[-webkit-touch-callout:none]'
const isCol = id => String(id).startsWith('col:')

// While a column is dragged only the other columns are targets (not No
// status); a card goes over the card under the pointer, else its column
function collide(args) {
  if (args.active.data.current?.type === 'column') {
    return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(c => c.data.current?.type === 'column' && c.data.current.key !== LOOSE) })
  }
  const hits = pointerWithin(args)
  if (hits.length) return [hits.find(h => !isCol(h.id)) ?? hits[0]]
  return closestCorners(args)
}

// A board widget (lib/board.js): its folder's name and ⋯ on top, then its
// columns side by side, scrolling sideways; No status first while it has
// cards. A card shows the file's name, its description and the values of the
// board's chosen properties; tapping it opens the file. Cards and columns are
// dragged into any order (with a mouse right away; on touch after holding
// 0.25s, so a swipe still scrolls): a card dropped in another column moves its
// file there, a column's title moves the column. Everything it does is in
// useBoard; `services` come from the app (widgets/index.js).
export default function Board({ id, services, onRemove }) {
  const { ready, board, data, title, ...act } = useBoard(id, services)
  const { notes, canEdit, openFile } = services
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )
  const [drag, setDrag] = useState(null) // { id, type, items } while dragging: each column's cards as shown meanwhile
  const [renaming, setRenaming] = useState(null) // the column whose Rename / Delete sheet is open
  const [deleting, setDeleting] = useState(null)
  const [choosing, setChoosing] = useState(null) // the open checklist: 'columns' | 'properties'
  const off = !canEdit || !board || data?.missing
  const hidden = board && data && !data.missing ? data.columns.filter(c => board.hidden.includes(c.name)) : []

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost-outline" size="icon" aria-label="Board actions" className="shrink-0 border-muted-foreground/50">
          <DotsThree weight="bold" size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
        <DropdownMenuItem disabled={off} onSelect={() => setChoosing('columns')}><Columns /> Show columns…</DropdownMenuItem>
        {hidden.map(c => (
          <DropdownMenuItem key={c.key} onSelect={() => act.openColumn(c)} className="text-muted-foreground">
            <Folder /> <span className="min-w-0 truncate">{c.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={off} onSelect={() => setChoosing('properties')}><Tag /> Card properties…</DropdownMenuItem>
        <DropdownMenuItem disabled={off} onSelect={act.newColumn}><Plus /> New column</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={!canEdit} onSelect={onRemove}><Trash /> Remove board</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  let body
  if (!ready) body = <div className="flex justify-center py-12"><Spinner /></div>
  else if (!board) body = <p className="py-6 text-center text-sm text-muted-foreground">This board's settings can't be read.</p>
  else if (data.missing) body = <p className="py-6 text-center text-sm text-muted-foreground">Its folder “{board.folder}” is gone.</p>
  else {
    const columns = [...(data.loose.length ? [{ key: LOOSE, name: 'No status', cards: data.loose }] : []), ...data.columns.filter(c => !board.hidden.includes(c.name))]
    const base = Object.fromEntries(columns.map(c => [c.key, c.cards.map(card => card.path)]))
    const items = drag?.items ?? base
    const columnOf = path => Object.keys(items).find(k => items[k].includes(path))
    const target = over => over.data.current?.type === 'column' ? over.data.current.key : columnOf(over.data.current?.path)

    const onDragOver = ({ active, over }) => {
      if (!over || drag?.type !== 'card') return
      const path = active.data.current.path
      const from = columnOf(path)
      const to = target(over)
      if (to === undefined || from === to) return
      const list = items[to].filter(p => p !== path)
      const at = over.data.current?.type === 'card' ? list.indexOf(over.data.current.path) : list.length
      list.splice(at < 0 ? list.length : at, 0, path)
      setDrag(d => ({ ...d, items: { ...items, [from]: items[from].filter(p => p !== path), [to]: list } }))
    }

    const onDragEnd = ({ active, over }) => {
      setDrag(null)
      if (!over) return
      if (active.data.current.type === 'column') {
        const to = target(over)
        const names = data.columns.map(c => c.key)
        if (to !== undefined && to !== LOOSE) act.moveColumn(active.data.current.key, names.indexOf(to))
        return
      }
      const path = active.data.current.path
      const column = columnOf(path)
      if (column === undefined) return
      let list = items[column]
      if (over.data.current?.type === 'card' && over.data.current.path !== path) {
        list = arrayMove(list, list.indexOf(path), list.indexOf(over.data.current.path))
      }
      act.placeCard(path, column, list.indexOf(path))
    }

    const byPath = Object.fromEntries(columns.flatMap(c => c.cards.map(card => [card.path, card])))
    const dragged = drag && (drag.type === 'card' ? drag.path : columns.find(c => c.key === drag.key))
    body = (
      <DndContext
        sensors={canEdit ? sensors : []}
        collisionDetection={collide}
        onDragStart={({ active }) => setDrag({ ...active.data.current, items: base })}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDrag(null)}
      >
        <div data-no-pull className="-mx-space flex items-start gap-space-sm overflow-x-auto px-space pb-space-sm">
          <SortableContext items={columns.map(c => colId(c.key))} strategy={horizontalListSortingStrategy}>
            {columns.map(c => (
              <Column
                key={c.key} column={c} canEdit={canEdit}
                onNewCard={() => act.newCard(c.key === LOOSE ? board.folder : c.path)}
                onRename={() => setRenaming(c)} onDelete={() => setDeleting(c)}
              >
                <SortableContext items={items[c.key].map(cardId)} strategy={verticalListSortingStrategy}>
                  {items[c.key].map(path => <Card key={path} path={path} text={notes[path]} board={board} onOpen={openFile} />)}
                </SortableContext>
              </Column>
            ))}
          </SortableContext>
          {!columns.length && <p className="py-6 text-sm text-muted-foreground">No columns yet: its subfolders become columns.</p>}
        </div>
        <DragOverlay>
          {dragged && drag.type === 'card' && byPath[dragged] && <CardBody path={dragged} text={notes[dragged]} board={board} className="rotate-2 shadow-lg" />}
          {dragged && drag.type === 'column' && (
            <div className="w-72 rotate-1 rounded-lg bg-secondary p-space-sm shadow-lg">
              <ColumnTitle column={dragged} grip />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    )
  }

  return (
    <section className="flex shrink-0 flex-col gap-space-sm">
      <div className="flex min-h-control items-center gap-space-sm">
        <h2 className="min-w-0 flex-1 truncate px-space-xs text-base font-bold">{title}</h2>
        {menu}
      </div>
      {body}
      {renaming && (
        <RenameModal
          item={{ name: renaming.name, path: renaming.path, type: 'dir' }}
          onRename={name => {
            const err = act.renameColumn(renaming, name)
            if (!err) setRenaming(null)
            return err
          }}
          onClose={() => setRenaming(null)}
        />
      )}
      {choosing === 'columns' && board && (
        <CheckListModal
          title="Show columns"
          description="Hidden columns are listed in the board's menu; choosing one opens its folder."
          items={data.columns.map(c => c.name)}
          selected={data.columns.map(c => c.name).filter(n => !board.hidden.includes(n))}
          onChange={act.showColumns}
          empty="No columns yet: its subfolders become columns."
          onClose={() => setChoosing(null)}
        />
      )}
      {choosing === 'properties' && board && (() => {
        const available = [...new Set([...data.loose, ...data.columns.flatMap(c => c.cards)]
          .flatMap(c => notes[c.path] === undefined ? [] : frontMatter(notes[c.path])?.props.map(p => p.key) ?? []))]
          .filter(k => k !== DESCRIPTION && !board.properties.includes(k)).sort()
        return (
          <CheckListModal
            title="Card properties"
            description="Their values show on the cards, without names. The description always shows."
            items={[...board.properties, ...available]}
            selected={board.properties}
            onChange={act.setProperties}
            addLabel="New property"
            empty="Its notes have no other properties yet."
            onClose={() => setChoosing(null)}
          />
        )
      })()}
      {deleting && (
        <ColumnDeleteModal
          name={deleting.name}
          count={deleting.cards.length}
          onDelete={keep => { setDeleting(null); act.deleteColumn(deleting, keep) }}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  )
}

// A column's name; `grip`: the drag indicator before it (a column that can be moved)
function ColumnTitle({ column, grip }) {
  return (
    <div className="flex min-h-control-md items-center gap-1 px-space-xs">
      {grip && <DotsSixVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
      <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{column.name}</h3>
    </div>
  )
}

// A column: a drop target for cards; its title moves it (not No status, which stays first).
// ⋯ beside the title: Rename / Delete (not No status); New card under its cards.
function Column({ column, canEdit, onNewCard, onRename, onDelete, children }) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: colId(column.key),
    data: { type: 'column', key: column.key },
    disabled: { draggable: column.key === LOOSE, droppable: false },
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('flex w-72 shrink-0 flex-col gap-space-sm rounded-lg bg-secondary/60 p-space-sm', isDragging && 'opacity-40')}
    >
      {column.key === LOOSE ? <ColumnTitle column={column} /> : (
        <div className="flex items-center gap-1">
          <div ref={setActivatorNodeRef} {...attributes} {...listeners} className={cn('min-w-0 flex-1 cursor-grab touch-manipulation select-none', NO_CALLOUT)}>
            <ColumnTitle column={column} grip />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${column.name}`} disabled={!canEdit} className="size-control-md shrink-0 text-muted-foreground hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10">
                <DotsThree weight="bold" size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
              <DropdownMenuItem onSelect={onRename}><PencilSimple /> Rename</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {children}
      <Button variant="ghost" disabled={!canEdit} className="justify-start gap-2 px-3 text-sm font-normal text-muted-foreground hover:bg-muted-foreground/10" onClick={onNewCard}>
        <Plus /> New card
      </Button>
    </div>
  )
}

function Card({ path, text, board, onOpen }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: cardId(path),
    data: { type: 'card', path },
  })
  return (
    <CardBody
      ref={setNodeRef}
      path={path} text={text} board={board}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
      onClick={() => onOpen(path)}
      {...attributes} {...listeners}
    />
  )
}

// What a card shows: the file's name, its description, the board's chosen properties' values
const CardBody = forwardRef(function CardBody({ path, text, board, className, ...props }, ref) {
  const fm = text === undefined ? [] : frontMatter(text)?.props ?? []
  const shown = [DESCRIPTION, ...board.properties].flatMap(key => fm.filter(p => p.key === key))
  return (
    <button
      ref={ref}
      type="button"
      className={cn('flex w-full touch-manipulation select-none flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left shadow-sm outline-none transition-colors hover:bg-secondary/40 focus-visible:ring-1 focus-visible:ring-ring', NO_CALLOUT, className)}
      {...props}
    >
      <span className="break-words text-sm font-medium">{text === undefined ? displayName(path) : noteTitle(text, displayName(path))}</span>
      <PropertyBadges props={shown} clamp className="pt-1" />
    </button>
  )
})
