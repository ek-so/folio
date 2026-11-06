import { useState, useMemo, forwardRef } from 'react'
import { DotsThree, Trash, Plus, PencilSimple, Tag, Columns } from '@phosphor-icons/react'
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors,
  closestCenter, closestCorners, pointerWithin,
} from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils.js'
import { Button } from '@/components/ui/button.jsx'
import { Tray, TrayTitle, TRAY_BUTTON } from '@/components/ui/tray.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import PropertyBadges from '@/components/PropertyBadges.jsx'
import Spinner from '@/components/Spinner.jsx'
import RenameModal from '@/components/RenameModal.jsx'
import ConfirmModal from '@/components/ConfirmModal.jsx'
import CheckListModal from './CheckListModal.jsx'
import CardMenu from './CardMenu.jsx'
import { displayName } from '@/lib/files.js'
import { openLink } from '@/lib/previewLinks.js'
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

// A board widget (board.js): its folder's name and ⋯ on top, then its
// columns side by side, scrolling sideways; No status first while it has
// cards. A card shows the note's title, its description and the values of the
// board's chosen properties; tapping it opens the file. Cards and columns are
// dragged into any order (with a mouse right away; on touch after holding
// 0.25s, so a swipe still scrolls): a card dropped in another column moves its
// file there, a column's title moves the column. Everything it does is in
// useBoard; `services` come from the app (widgets/index.js).
export default function Board({ id, services, onRemove }) {
  const { ready, board, data, title, ...act } = useBoard(id, services)
  const { notes, canEdit, openFile, openFolder } = services
  const files = useMemo(() => Object.fromEntries(services.files.map(f => [f, true])), [services.files]) // as the preview's links want them
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )
  const [drag, setDrag] = useState(null) // { id, type, items } while dragging: each column's cards as shown meanwhile
  const [renaming, setRenaming] = useState(null) // the column whose Rename / Remove sheet is open
  const [deleting, setDeleting] = useState(null) // the column whose Remove is being confirmed
  const [dropping, setDropping] = useState(null) // the property whose removal is being confirmed
  const [choosing, setChoosing] = useState(null) // the open checklist: 'columns' | 'properties'
  const off = !canEdit || !board || data?.missing

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost-outline" size="icon" aria-label="Board actions" className="shrink-0 border-muted-foreground/50">
          <DotsThree weight="bold" size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
        <DropdownMenuItem disabled={off} onSelect={() => setChoosing('columns')}><Columns /> Columns</DropdownMenuItem>
        <DropdownMenuItem disabled={off} onSelect={() => setChoosing('properties')}><Tag /> Properties</DropdownMenuItem>
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

    // The card moved to the end of another column
    const moveToColumn = (path, key) => act.placeCard(path, key, items[key].filter(p => p !== path).length)
    const cardMenu = path => off ? undefined : (
      <CardMenu
        path={path}
        title={notes[path] === undefined ? displayName(path) : noteTitle(notes[path], displayName(path))}
        columns={columns} column={columnOf(path)}
        onTitle={act.canTitle(path) ? title => act.setTitle(path, title) : undefined}
        onMove={key => moveToColumn(path, key)}
        onEditColumns={() => setChoosing('columns')}
        onDelete={() => act.deleteCard(path)}
      />
    )
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
                  {items[c.key].map(path => <Card key={path} path={path} menu={cardMenu(path)} text={notes[path]} board={board} files={files} onOpen={openFile} onOpenFolder={openFolder} onChange={off ? undefined : act.setProperty} options={act.valuesOf} onRemoveValue={off ? undefined : act.removeValue} valueCount={act.valueCount} chosen={services.tagColors.colors} onEditValue={off || !services.tagColors.canEdit ? undefined : act.editValue} />)}
                </SortableContext>
              </Column>
            ))}
          </SortableContext>
          {!columns.length && <p className="py-6 text-sm text-muted-foreground">No columns yet: its subfolders become columns.</p>}
        </div>
        <DragOverlay>
          {dragged && drag.type === 'card' && byPath[dragged] && <CardBody path={dragged} text={notes[dragged]} board={board} files={files} chosen={services.tagColors.colors} className="rotate-2 border-transparent shadow-lg" />}
          {dragged && drag.type === 'column' && (
            <Tray className="w-80 rotate-1 bg-secondary shadow-lg">
              <TrayTitle grip>{dragged.name}</TrayTitle>
            </Tray>
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
          title="Columns"
          description="Tick the columns to show. Each one's folder can be opened or removed here."
          items={data.columns.map(c => c.name)}
          onOpen={name => { setChoosing(null); act.openColumn(data.columns.find(c => c.name === name)) }}
          openLabel="Open folder"
          onDelete={name => { setChoosing(null); setDeleting(data.columns.find(c => c.name === name)) }}
          addLabel="New column"
          onAdd={act.addColumn}
          selected={data.columns.map(c => c.name).filter(n => !board.hidden.includes(n))}
          onChange={act.showColumns}
          empty="No columns yet: its subfolders become columns."
          onClose={() => setChoosing(null)}
        />
      )}
      {choosing === 'properties' && board && (
        <CheckListModal
          title="Properties"
          description="Their values show on the cards, without names. The description always shows."
          items={[...board.properties, ...act.propertyKeys().filter(k => !board.properties.includes(k))]}
          selected={board.properties}
          onChange={act.setProperties}
          addLabel="New property"
          onAdd={key => {
            const error = act.keyError(key)
            if (error) return error
            if (!board.properties.includes(key)) act.setProperties([...board.properties, key])
            return null
          }}
          onRename={(from, to) => act.renameProperty(from, to)}
          onDelete={key => { setChoosing(null); setDropping(key) }}
          empty="Its notes have no other properties yet."
          onClose={() => setChoosing(null)}
        />
      )}
      {dropping && (
        <ConfirmModal
          title={`Remove property “${dropping}”?`}
          description={`It's removed, with its value, from ${act.notesWith(dropping)} note${act.notesWith(dropping) === 1 ? '' : 's'} in this board's folder. It's removed from GitHub when you sync.`}
          confirm="Remove"
          onConfirm={() => { act.removeProperty(dropping); setDropping(null) }}
          onClose={() => setDropping(null)}
        />
      )}
      {deleting && (
        <ConfirmModal
          title={`Remove column “${deleting.name}”?`}
          description={deleting.cards.length
            ? `It has ${deleting.cards.length} card${deleting.cards.length === 1 ? '' : 's'}. Remove them too, or move them to No status? It's removed from GitHub when you sync.`
            : 'Its folder is removed from GitHub when you sync.'}
          confirm={deleting.cards.length ? 'Remove with cards' : 'Remove'}
          onConfirm={() => { setDeleting(null); act.deleteColumn(deleting, false) }}
          alternative={deleting.cards.length ? { label: 'Move to No status', onSelect: () => { setDeleting(null); act.deleteColumn(deleting, true) } } : undefined}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
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
    <Tray
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('w-80 shrink-0', isDragging && 'opacity-40')}
    >
      {column.key === LOOSE ? <TrayTitle>{column.name}</TrayTitle> : (
        <div className="flex items-center gap-1">
          <div ref={setActivatorNodeRef} {...attributes} {...listeners} className={cn('min-w-0 flex-1 cursor-grab touch-manipulation select-none', NO_CALLOUT)}>
            <TrayTitle grip>{column.name}</TrayTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${column.name}`} disabled={!canEdit} className={TRAY_BUTTON}>
                <DotsThree weight="bold" size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
              <DropdownMenuItem onSelect={onRename}><PencilSimple /> Rename</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash /> Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {children}
      <Button variant="ghost" disabled={!canEdit} className="justify-start gap-2 px-3 text-sm font-normal text-muted-foreground hover:bg-muted-foreground/10" onClick={onNewCard}>
        <Plus /> New card
      </Button>
    </Tray>
  )
}

// A click on a link in the card's description opens what it points to, any other opens the card
function Card({ menu, path, text, board, files, onOpen, onOpenFolder, onChange, options, onRemoveValue, valueCount, chosen, onEditValue }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: cardId(path),
    data: { type: 'card', path },
  })
  return (
    <CardBody
      ref={setNodeRef}
      path={path} text={text} board={board} files={files} menu={menu}
      onChange={onChange && ((key, value) => onChange(path, key, value))} options={options} onRemoveValue={onRemoveValue} valueCount={valueCount} chosen={chosen} onEditValue={onEditValue}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
      onClick={e => {
        const link = e.target.closest('a[href]')
        if (!link) return onOpen(path)
        e.preventDefault()
        openLink(link.getAttribute('href'), { path, files, onOpenFile: onOpen, onNavigate: onOpenFolder })
      }}
      {...attributes} {...listeners}
    />
  )
}

// What a card shows: the note's title, its description, the board's chosen properties' values. A div, not a button:
// the badges in it are buttons
const CardBody = forwardRef(function CardBody({ path, text, board, files, menu, onChange, options, onRemoveValue, valueCount, chosen, onEditValue, className, ...props }, ref) {
  const fm = text === undefined ? [] : frontMatter(text)?.props ?? []
  const shown = fm.filter(p => p.key === DESCRIPTION || board.properties.includes(p.key)) // in the file's order
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); props.onClick?.(e) } }}
      className={cn('group flex w-full cursor-pointer touch-manipulation select-none flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left outline-none transition-[box-shadow,border-color] hover:border-transparent hover:shadow-md focus-visible:ring-1 focus-visible:ring-ring', NO_CALLOUT, className)}
      {...props}
    >
      <div className="flex items-start gap-1">
        <span className="min-w-0 flex-1 break-words text-sm font-medium">{text === undefined ? displayName(path) : noteTitle(text, displayName(path))}</span>
        {menu}
      </div>
      <PropertyBadges props={shown} path={path} files={files} clamp className="pt-1" onChange={onChange} options={options} onRemoveValue={onRemoveValue} valueCount={valueCount} scopeName="this board" chosen={chosen} onEditValue={onEditValue} />
    </div>
  )
})
