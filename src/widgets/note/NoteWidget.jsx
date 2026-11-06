import { useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import { DotsThree, Trash, PencilSimple, Check, ArrowsOut, Plus, ListBullets, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import Spinner from '@/components/Spinner.jsx'
import RenameModal from '@/components/RenameModal.jsx'
import ConfirmModal from '@/components/ConfirmModal.jsx'
import EditListModal from '@/components/EditListModal.jsx'
import FileIcon from '@/components/FileIcon.jsx'
import MarkdownPreview from '@/components/MarkdownPreview.jsx'
import MarkdownEditor from '@/components/MarkdownEditor.jsx'
import { useNote } from '@/hooks/useNote.js'
import { displayName } from '@/lib/files.js'
import { withFixedDates } from '@/lib/dates.js'
import ResizeHandle from '@/components/ResizeHandle.jsx'
import { Tray, TrayTitle, TRAY_BUTTON } from '@/components/ui/tray.jsx'
import { NOTE_HEIGHT, clampSize } from '@/lib/resize.js'
import { notePath, parseNotes, serializeNotes, notesHeight, resizedNotes, addedNote, removedNote, reorderedNote } from './note.js'
import { NotePicker } from './NoteSetup.jsx'

// The notes widget (note.js): "Notes" and its ⋯ (Add note…, Edit notes…: order them and take them out, Remove widget)
// on top, then each note in a grey tray like a board's column, side by side, at least 320px wide (narrower, they wrap
// onto the next line): its name, Edit (✓ when done) and its own ⋯ (Open full screen, Rename note, Remove from widget),
// then its text in a box that scrolls inside; all boxes are one height (resizable on desktop by one handle under them, edge to edge).
// A double tap edits at the tapped word. Edits save on their own, like on the note's own page; opening one full
// screen is opening the note, as a board's card does. Taking a note out of the widget keeps the note.
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
      <div className="relative flex flex-wrap items-start gap-space-sm">
        {settings.notes.map(entry => (
          <NoteTray
            key={`${entry.file}:${services.discards}`} path={entry.file} services={services} height={dragged ?? height}
            onTakeOut={canEdit ? () => setRemoving(settings.notes.indexOf(entry)) : null}
          />
        ))}
        {/* One handle under them all, edge to edge: their one height */}
        {resize && <ResizeHandle vertical label="Resize notes" size={dragged ?? height} limits={NOTE_HEIGHT} className="hidden md:flex" onResize={resize} />}
      </div>
    )

  return (
    <section className="flex shrink-0 flex-col gap-space-sm">
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
            <DropdownMenuItem variant="destructive" disabled={!services.canEdit} onSelect={onRemove}><Trash /> Remove widget</DropdownMenuItem>
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

// One note's tray: its name, Edit and ⋯ over its box, `height` tall on desktop (the widget's). `onTakeOut` (null: it can't be) asks to remove it from the widget
function NoteTray({ path, services, height, onTakeOut }) {
  const found = services.noteFile(path)
  const [renaming, setRenaming] = useState(false)
  const item = { name: path.slice(path.lastIndexOf('/') + 1), path, type: 'file' }
  const open = () => { window.dispatchEvent(new Event('folio:flush')); services.openFile(path) } // typing first
  const tray = (actions, body) => (
    <Tray className="min-w-0 flex-[1_1_20rem]">
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1"><TrayTitle>{displayName(path)}</TrayTitle></div>
        {actions}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${displayName(path)}`} className={TRAY_BUTTON}>
              <DotsThree weight="bold" size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
            <DropdownMenuItem disabled={!found} onSelect={open}><ArrowsOut /> Open full screen</DropdownMenuItem>
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
  if (!found) return tray(null, <p className="py-6 text-center text-sm text-muted-foreground">This note is gone.</p>)
  return <NoteBox path={path} found={found} services={services} tray={tray} height={height} />
}

// The note itself: read from GitHub (or this device's edits), shown or edited in the box
// `height`: the box's
function NoteBox({ path, found, services, tray, height }) {
  const { content, change, loading, loadError } = useNote(found.entry, found.edited, (text, original) => services.saveNote(path, text, original))
  const [editing, setEditing] = useState(false)
  const textareaRef = useRef()
  const ready = !loading && !loadError

  // Inside the tap, so the textarea gets focus and mobile keyboards open. `pos`: markdown offset
  // to put the cursor at (a double tap: the tapped word); Edit starts at the top
  function startEditing(pos = 0) {
    flushSync(() => setEditing(true))
    textareaRef.current?.setSelectionRange(pos, pos)
    textareaRef.current?.focus()
  }

  // Dates typed in any format are written as "17 Oct 2026, 14:30" (lib/dates.js) on the way out
  function finishEditing() {
    const fixed = withFixedDates(content)
    if (fixed !== content) change(fixed)
    setEditing(false)
  }

  const actions = editing ? (
    <Button variant="success" size="icon" aria-label="Done" tooltip="Done" className="size-control-md shrink-0" onClick={finishEditing}><Check /></Button>
  ) : (
    <Button variant="ghost" size="icon" aria-label="Edit" tooltip="Edit" disabled={!ready} className={TRAY_BUTTON} onClick={() => startEditing()}><PencilSimple /></Button>
  )
  const body = loading ? <div className="flex flex-1 items-center justify-center"><Spinner /></div>
    : loadError ? <p className="px-6 py-12 text-center text-sm text-muted-foreground">Couldn't open this note. It isn't saved on this device yet — connect to the internet and pull to refresh.</p>
    : editing ? <MarkdownEditor ref={textareaRef} content={content} onChange={change} onDone={finishEditing} />
    : <MarkdownPreview content={content} path={path} files={services.virtual} onDoubleTap={startEditing} onChange={change} onOpenFile={services.openFile} onNavigate={services.openFolder} />
  // Phones: the default height; desktop: the widget's
  return tray(actions, (
    <div style={{ '--note-h': `${height}px` }} className="h-80 md:h-(--note-h)">
      <div data-no-pull className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">{body}</div>
    </div>
  ))
}
