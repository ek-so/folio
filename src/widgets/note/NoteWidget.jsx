import { useState } from 'react'
import { DotsThree, PencilSimple, Plus, ListBullets, X, FileText } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import Spinner from '@/components/Spinner.jsx'
import EmptyState from '@/components/EmptyState.jsx'
import RenameModal from '@/components/RenameModal.jsx'
import ConfirmModal from '@/components/ConfirmModal.jsx'
import EditListModal from '@/components/EditListModal.jsx'
import FileIcon from '@/components/FileIcon.jsx'
import MarkdownPreview from '@/components/MarkdownPreview.jsx'
import { NO_CALLOUT } from '@/components/NoteCard.jsx'
import { cn, isPortaled } from '@/lib/utils.js'
import { useNote } from '@/hooks/useNote.js'
import { displayName } from '@/lib/files.js'
import ResizeHandle from '@/components/ResizeHandle.jsx'
import { Tray, TrayTitle, TRAY_BUTTON } from '@/components/ui/tray.jsx'
import { NOTE_HEIGHT, clampSize } from '@/lib/resize.js'
import { notePath, parseNotes, serializeNotes, notesHeight, resizedNotes, addedNote, removedNote, replacedNote, reorderedNote } from './note.js'
import { NotePicker } from './NoteSetup.jsx'

// The notes widget (note.js): "Notes" and its ⋯ (Add note…, Edit notes…: order them and take them out, Remove widget)
// on top, then each note in a grey tray like a board's column, in a grid of two equal columns when each can be at least
// 320px (the widget at least 40.5rem wide: a container query), else one; an odd last note keeps its column's width: its name and its own ⋯ (Rename note, Remove from widget),
// then the note as a card: its preview, cut off; all cards are one height (resizable on desktop by one handle under them,
// edge to edge). A tap on a card opens the note, as a board's card does; ticking a task there saves like on the note's
// own page. Taking a note out of the widget keeps the note.
export default function NoteWidget({ id, services, onRemove }) {
  const file = services.config.read(notePath(id))
  const settings = file.ready && file.text !== undefined ? parseNotes(file.text) : null
  const canEdit = services.canEdit && !!settings
  const save = next => services.update(services.config.write(notePath(id), serializeNotes(next)))
  const [adding, setAdding] = useState(false)
  const [listing, setListing] = useState(false) // Edit notes is open
  const [removing, setRemoving] = useState(null) // the index of the note whose removal is being confirmed
  const [dragged, setDragged] = useState(null) // the boxes' height while an edge is dragged, until it's saved
  const height = settings ? notesHeight(settings) : NOTE_HEIGHT.default
  // Any box's bottom edge resizes them all (one height for the widget); null when it can't be saved
  const resize = canEdit ? (px, done = true) => {
    const next = clampSize(px, NOTE_HEIGHT)
    if (!done) return setDragged(next)
    setDragged(null)
    if (next !== height) save(resizedNotes(settings, next))
  } : null

  const message = text => <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>
  const body = !file.ready ? <div className="flex justify-center py-12"><Spinner /></div>
    : !settings ? message("This notes widget's settings can't be read.")
    : !settings.notes.length ? message('No notes yet. Add one from ⋯.')
    : (
      <div className="relative grid grid-cols-1 items-start gap-space-sm @min-[40.5rem]:grid-cols-2">
        {settings.notes.map(entry => (
          <NoteTray
            key={`${entry.file}:${services.discards}`} path={entry.file} services={services} height={dragged ?? height}
            onTakeOut={canEdit ? () => setRemoving(settings.notes.indexOf(entry)) : null}
            onReplace={canEdit ? (to, first = ch => ch) => services.update(ch => services.config.write(notePath(id), serializeNotes(replacedNote(settings, entry.file, to)))(first(ch))) : null}
          />
        ))}
        {/* One handle under them all, edge to edge: their one height */}
        {resize && <ResizeHandle vertical label="Resize notes" size={dragged ?? height} limits={NOTE_HEIGHT} className="hidden md:flex" onResize={resize} />}
      </div>
    )

  return (
    <section className="@container flex shrink-0 flex-col gap-space-sm">
      <div className="flex min-h-control items-center gap-space-sm">
        <h2 className="min-w-0 flex-1 truncate px-space-xs text-base font-bold">Notes</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost-outline" size="icon" aria-label="Notes widget actions" className="shrink-0 border-muted-foreground/50">
              <DotsThree weight="bold" size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
            <DropdownMenuItem disabled={!canEdit} onSelect={() => setAdding(true)}><Plus /> Add note…</DropdownMenuItem>
            <DropdownMenuItem disabled={!canEdit || !settings.notes.length} onSelect={() => setListing(true)}><ListBullets /> Edit notes…</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={!services.canEdit} onSelect={onRemove}><X /> Remove widget</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {body}
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
    </section>
  )
}

// One note's tray: its name and ⋯ over its card, `height` tall on desktop (the widget's). `onTakeOut` (null: it can't be) asks to remove it from the widget
function NoteTray({ path, services, height, onTakeOut, onReplace }) {
  const found = services.noteFile(path)
  const [renaming, setRenaming] = useState(false)
  const [replacing, setReplacing] = useState(false) // picking a note in place of this one, which is gone
  const item = { name: path.slice(path.lastIndexOf('/') + 1), path, type: 'file' }
  const open = () => { window.dispatchEvent(new Event('folio:flush')); services.openFile(path) } // typing first
  const tray = body => (
    <Tray className="min-w-0">
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1"><TrayTitle>{displayName(path)}</TrayTitle></div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${displayName(path)}`} className={TRAY_BUTTON}>
              <DotsThree weight="bold" size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
            <DropdownMenuItem disabled={!found} onSelect={() => setRenaming(true)}><PencilSimple /> Rename note</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={!onTakeOut} onSelect={onTakeOut}><X /> Remove from widget</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {body}
      {renaming && found && (
        <RenameModal
          item={item}
          onRename={name => {
            const error = services.rename(item, name)
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
// (the widget's), cut off with a fade at the bottom, lifting on hover like every card. A tap opens the note (`onOpen`);
// ticking a task, a link, a date and a list's grip work in place as in the note
function NoteBox({ found, path, services, tray, height, onOpen }) {
  const { content, change, loading, loadError } = useNote(found.entry, found.edited, (text, original) => services.saveNote(path, text, original))
  const body = loading ? <div className="flex flex-1 items-center justify-center"><Spinner /></div>
    : loadError ? <p className="px-6 py-12 text-center text-sm text-muted-foreground">Couldn't open this note. It isn't saved on this device yet — connect to the internet and pull to refresh.</p>
    : <MarkdownPreview clip content={content} path={path} files={services.virtual} onChange={change} onOpenFile={services.openFile} onNavigate={services.openFolder} />
  const own = e => isPortaled(e) || e.target.closest('a, input, button, summary, .link-spot, .date-spot, .list-grip')
  // Phones: the default height; desktop: the widget's
  return tray(
    <div style={{ '--note-h': `${height}px` }} className="h-80 md:h-(--note-h)">
      <div
        role="button" tabIndex={0} aria-label={`Open ${displayName(path)}`}
        onClick={e => { if (!own(e)) onOpen() }}
        onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen() } }}
        className={cn('hover-lift relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-card outline-none focus-visible:ring-1 focus-visible:ring-ring', NO_CALLOUT)}
      >
        {body}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-card" />
      </div>
    </div>
  )
}
