import { useState } from 'react'
import { PencilSimple, Plus, ListBullets, Trash, FileText } from '@phosphor-icons/react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import Spinner from '@/components/Spinner.jsx'
import EmptyState from '@/components/EmptyState.jsx'
import RenameModal from '@/components/RenameModal.jsx'
import ConfirmModal from '@/components/ConfirmModal.jsx'
import EditListModal from '@/components/EditListModal.jsx'
import FileIcon from '@/components/FileIcon.jsx'
import MarkdownPreview from '@/components/MarkdownPreview.jsx'
import { NO_CALLOUT, CardEmoji } from '@/components/NoteCard.jsx'
import { EmojiSubmenu } from '@/components/EmojiPicker.jsx'
import CopyLinkItem from '@/components/CopyLinkItem.jsx'
import { repoLink } from '@/lib/markdown.js'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDragSensors } from '@/hooks/useDragSensors.js'
import { cn } from '@/lib/utils.js'
import { useNote } from '@/hooks/useNote.js'
import { displayName, fileName } from '@/lib/files.js'
import { fileItem } from '@/lib/folderNotes.js'
import ResizeHandle from '@/components/ResizeHandle.jsx'
import { Tray, TrayTitle } from '@/components/ui/tray.jsx'
import { NOTE_HEIGHT, clampSize } from '@/lib/resize.js'
import { notePath, parseNotes, serializeNotes, notesHeight, resizedNotes, addedNote, removedNote, replacedNote, reorderedNote } from './note.js'
import { NotePicker } from './NoteSetup.jsx'
import WidgetFrame from '@/components/WidgetFrame.jsx'
import MoreButton from '@/components/MoreButton.jsx'
import { EmptyMessage } from '@/components/EmptyState.jsx'

// The notes widget (note.js): "Notes" and its ⋯ (Add note…, Edit notes…: order them and take them out, Remove widget)
// on top, then each note in a grey tray like a board's column, in a grid of two equal columns when each can be at least
// 320px (the widget at least 40.5rem wide: a container query), else one; an odd last note keeps its column's width: its name and its own ⋯ (Rename note, Remove from widget),
// then the note as a card: its preview, cut off; all cards are one height (resizable on desktop by one handle under them,
// edge to edge). The card is only a picture of the note: a tap anywhere on it opens the note, as a board's card does.
// A tray's title (with its drag indicator) moves it among the others, as a board's column. Taking a note out of the widget keeps the note.
export default function NoteWidget({ id, services, onRemove }) {
  const file = services.config.read(notePath(id))
  const settings = file.ready && file.text !== undefined ? parseNotes(file.text) : null
  const canEdit = services.canEdit && !!settings
  const save = next => services.update(services.config.write(notePath(id), serializeNotes(next)))
  const [adding, setAdding] = useState(false)
  const [listing, setListing] = useState(false) // Edit notes is open
  const [removing, setRemoving] = useState(null) // the index of the note whose removal is being confirmed
  const [dragged, setDragged] = useState(null) // the boxes' height while an edge is dragged, until it's saved
  const [moving, setMoving] = useState(null) // the note whose tray is being dragged
  const sensors = useDragSensors()
  // A tray dropped on another takes its place
  const onDragEnd = ({ active, over }) => {
    setMoving(null)
    const files = settings.notes.map(n => n.file)
    const from = files.indexOf(active.id)
    const to = over ? files.indexOf(over.id) : -1
    if (from >= 0 && to >= 0 && from !== to) save(reorderedNote(settings, from, to))
  }
  const height = settings ? notesHeight(settings) : NOTE_HEIGHT.default
  // Any box's bottom edge resizes them all (one height for the widget); null when it can't be saved
  const resize = canEdit ? (px, done = true) => {
    const next = clampSize(px, NOTE_HEIGHT)
    if (!done) return setDragged(next)
    setDragged(null)
    if (next !== height) save(resizedNotes(settings, next))
  } : null

  // Only when its settings are read (WidgetFrame shows the other states)
  const body = () => !settings.notes.length ? <EmptyMessage>No notes yet. Add one from ⋯.</EmptyMessage>
    : (
      <DndContext
        sensors={canEdit ? sensors : []}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setMoving(active.id)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setMoving(null)}
      >
      <div className="relative grid grid-cols-1 items-start gap-space-sm @min-[40.5rem]:grid-cols-2 @min-[61rem]:grid-cols-3">
        <SortableContext items={settings.notes.map(n => n.file)} strategy={rectSortingStrategy}>
        {settings.notes.map(entry => (
          <NoteTray
            key={`${entry.file}:${services.discards}`} path={entry.file} services={services} height={dragged ?? height} canMove={canEdit}
            onTakeOut={canEdit ? () => setRemoving(settings.notes.indexOf(entry)) : null}
            onReplace={canEdit ? (to, first = ch => ch) => services.update(ch => services.config.write(notePath(id), serializeNotes(replacedNote(settings, entry.file, to)))(first(ch))) : null}
          />
        ))}
        </SortableContext>
        {/* One handle under them all, edge to edge: their one height */}
        {resize && <ResizeHandle vertical label="Resize notes" size={dragged ?? height} limits={NOTE_HEIGHT} className="hidden md:flex" onResize={resize} />}
      </div>
      <DragOverlay>
        {moving && (
          <Tray className="rotate-1 bg-secondary shadow-lg">
            <TrayTitle grip>{fileName(moving)}</TrayTitle>
          </Tray>
        )}
      </DragOverlay>
      </DndContext>
    )

  const menu = <>
    <DropdownMenuItem disabled={!canEdit} onSelect={() => setAdding(true)}><Plus /> Add note…</DropdownMenuItem>
    <DropdownMenuItem disabled={!canEdit || !settings.notes.length} onSelect={() => setListing(true)}><ListBullets /> Edit notes…</DropdownMenuItem>
  </>

  // Its dialogs sit beside its frame
  return <>
    <WidgetFrame
      title="Notes" noun="notes widget" menu={menu} removeLabel="Remove widget" onRemove={onRemove} canEdit={services.canEdit}
      ready={file.ready} readable={!!settings} className="@container"
    >{body}</WidgetFrame>
      {adding && (
        <NotePicker
          services={services}
          onPick={(path, first = ch => ch) => {
            setAdding(false)
            services.update(ch => services.config.write(notePath(id), serializeNotes(addedNote(settings, path)))(first(ch)))
          }}
          onClose={() => setAdding(false)}
        />
      )}
      {listing && settings && (
        <EditListModal
          title="Edit notes"
          description="Drag them into order. Taking one out keeps the note."
          items={settings.notes.map(n => ({ id: n.file, icon: <FileIcon path={n.file} />, title: displayName(n.file) }))}
          onMove={(from, to) => save(reorderedNote(settings, from, to))}
          onRemove={item => setRemoving(settings.notes.findIndex(n => n.file === item.id))}
          empty="No notes"
          onClose={() => setListing(false)}
        />
      )}
      {removing !== null && settings?.notes[removing] && (
        <ConfirmModal
          title={`Remove “${displayName(settings.notes[removing].file)}” from this widget?`}
          description="The note itself stays."
          onConfirm={() => { save(removedNote(settings, removing)); setRemoving(null) }}
          onClose={() => setRemoving(null)}
        />
      )}
  </>
}

// One note's tray: its name and ⋯ over its card, `height` tall on desktop (the widget's). `onTakeOut` (null: it can't be) asks to remove it from the widget.
// Its title, with the drag indicator, moves it (`canMove`; the tray stays in place, faded, while its overlay is dragged)
function NoteTray({ path, services, height, canMove, onTakeOut, onReplace }) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: path, disabled: !canMove })
  const found = services.noteFile(path)
  const [renaming, setRenaming] = useState(false)
  const [replacing, setReplacing] = useState(false) // picking a note in place of this one, which is gone
  const [menuOpen, setMenuOpen] = useState(false)
  const item = fileItem(path)
  const open = () => { window.dispatchEvent(new Event('folio:flush')); services.openFile(path) } // typing first
  const tray = body => (
    <Tray ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn('min-w-0', isDragging && 'opacity-40')}>
      <div className="flex items-center gap-space-xs">
        <div ref={setActivatorNodeRef} {...attributes} {...listeners} className={cn('min-w-0 flex-1', canMove && 'cursor-grab touch-manipulation select-none', NO_CALLOUT)}>
          <TrayTitle grip={canMove}><CardEmoji path={path} className="mr-1.5" />{fileName(path)}</TrayTitle>
        </div>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <MoreButton inRow aria-label={`Actions for ${displayName(path)}`} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
            <DropdownMenuItem disabled={!found} onSelect={() => setRenaming(true)}><PencilSimple /> Rename note</DropdownMenuItem>
            {found && <EmojiSubmenu path={path} onDone={() => setMenuOpen(false)} />}
            <CopyLinkItem link={repoLink(path)} disabled={!found} />
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={!onTakeOut} onSelect={onTakeOut}><Trash /> Remove from widget</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {body}
      {renaming && found && (
        <RenameModal
          item={item}
          onRename={(name, title) => {
            const error = services.rename(item, name, title)
            if (!error) setRenaming(false)
            return error
          }}
          onClose={() => setRenaming(false)}
        />
      )}
    </Tray>
  )
  // A note that's gone: Select note puts another in its place (`onReplace(path, first)`; null when it can't be saved)
  if (!found) return tray(<>
    <EmptyState message="This note is gone." action={{ label: 'Select note', icon: <FileText />, onClick: () => setReplacing(true), disabled: !onReplace }} />
    {replacing && <NotePicker title="Select note" services={services} onPick={(to, first) => { setReplacing(false); onReplace(to, first) }} onClose={() => setReplacing(false)} />}
  </>)
  return <NoteBox path={path} found={found} services={services} tray={tray} height={height} onOpen={open} />
}

// The note itself, read from GitHub (or this device's edits), as a card in the tray: its preview, `height` tall on desktop
// (the widget's), cut off with a fade at the bottom, lifting on hover like every card. Only a picture of the note: nothing in
// it reacts (inert, its checkboxes disabled, no text selection: no scrolling, ticking, links, focus or gestures); a tap
// anywhere opens the note (`onOpen`)
function NoteBox({ found, path, services, tray, height, onOpen }) {
  const { content, loading, loadError } = useNote(found.entry, found.edited, (text, original) => services.saveNote(path, text, original))
  const body = loading ? <div className="flex flex-1 items-center justify-center"><Spinner /></div>
    : loadError ? <EmptyMessage size="lg" className="px-space">Couldn't open this note. It isn't saved on this device yet — connect to the internet and pull to refresh.</EmptyMessage>
    : <MarkdownPreview clip compact content={content} path={path} files={services.virtual} />
  // Phones: the default height; desktop: the widget's
  return tray(
    <div style={{ '--note-h': `${height}px` }} className="h-50 md:h-(--note-h)">
      <div
        role="button" tabIndex={0} aria-label={`Open ${displayName(path)}`}
        onClick={onOpen}
        onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen() } }}
        className={cn('hover-lift relative flex h-full cursor-pointer select-none touch-manipulation flex-col overflow-hidden rounded-lg border border-border bg-card outline-none focus-visible:ring-1 focus-visible:ring-ring', NO_CALLOUT)}
      >
        <div inert="" className="pointer-events-none flex min-h-0 flex-1 flex-col">{body}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 max-h-48 bg-linear-to-t from-card from-15%" />
      </div>
    </div>
  )
}
