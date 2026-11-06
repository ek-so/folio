import { useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import { DotsThree, Trash, PencilSimple, Check, ArrowsOut } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import Spinner from '@/components/Spinner.jsx'
import RenameModal from '@/components/RenameModal.jsx'
import MarkdownPreview from '@/components/MarkdownPreview.jsx'
import MarkdownEditor from '@/components/MarkdownEditor.jsx'
import { useNote } from '@/hooks/useNote.js'
import { displayName } from '@/lib/files.js'
import { notePath, parseNote } from './note.js'

// A note widget (note.js): the note's file name, Edit (✓ when done) and ⋯ (Open full screen, Rename: renames
// the file, Remove) on top,
// then its text in a box of fixed height that scrolls inside; a double tap edits at the tapped word. Edits save on their own, like on
// the note's own page; opening it full screen is opening the note, as a board's card does.
export default function NoteWidget({ id, services, onRemove }) {
  const file = services.config.read(notePath(id))
  const note = file.ready && file.text !== undefined ? parseNote(file.text) : null
  const path = note?.file
  const found = path && services.noteFile(path)
  const open = () => { window.dispatchEvent(new Event('folio:flush')); services.openFile(path) } // typing first

  const [renaming, setRenaming] = useState(false)
  const frame = (title, body, actions) => (
    <Frame title={title} onOpen={found ? open : undefined} onRename={found ? () => setRenaming(true) : undefined} actions={actions} canRemove={services.canEdit} onRemove={onRemove}>
      {body}
      {renaming && found && (
        <RenameModal
          item={{ name: path.slice(path.lastIndexOf('/') + 1), path, type: 'file' }}
          onRename={name => {
            const error = services.rename({ name: path.slice(path.lastIndexOf('/') + 1), path, type: 'file' }, name)
            if (!error) setRenaming(false)
            return error
          }}
          onClose={() => setRenaming(false)}
        />
      )}
    </Frame>
  )
  const message = text => <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>
  if (!file.ready) return frame('Note', <div className="flex justify-center py-12"><Spinner /></div>)
  if (!note) return frame('Note', message("This note widget's settings can't be read."))
  if (!found) return frame(displayName(path), message(`Its note “${path}” is gone.`))
  return <NoteBox key={`${path}:${services.discards}`} path={path} found={found} services={services} frame={frame} />
}

// The note itself: read from GitHub (or this device's edits), shown or edited in the box
function NoteBox({ path, found, services, frame }) {
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

  const actions = editing ? (
    <Button variant="success" size="icon" aria-label="Done" tooltip="Done" className="shrink-0" onClick={() => setEditing(false)}><Check /></Button>
  ) : (
    <Button variant="ghost-outline" size="icon" aria-label="Edit" tooltip="Edit" disabled={!ready} className="shrink-0 border-muted-foreground/50" onClick={() => startEditing()}><PencilSimple /></Button>
  )
  const body = loading ? <div className="flex flex-1 items-center justify-center"><Spinner /></div>
    : loadError ? <p className="px-6 py-12 text-center text-sm text-muted-foreground">Couldn't open this note. It isn't saved on this device yet — connect to the internet and pull to refresh.</p>
    : editing ? <MarkdownEditor ref={textareaRef} content={content} onChange={change} onDone={() => setEditing(false)} />
    : <MarkdownPreview content={content} path={path} files={services.virtual} onDoubleTap={startEditing} onChange={change} onOpenFile={services.openFile} onNavigate={services.openFolder} />
  return frame(displayName(path), <div data-no-pull className="flex h-80 flex-col overflow-hidden rounded-lg border border-border bg-card">{body}</div>, actions)
}

// The widget's title row over `children`; ⋯ opens the note full screen (`onOpen`)
function Frame({ title, onOpen, onRename, actions, canRemove, onRemove, children }) {
  return (
    <section className="flex shrink-0 flex-col gap-space-sm">
      <div className="flex min-h-control items-center gap-space-sm">
        <h2 className="min-w-0 flex-1 truncate px-space-xs text-base font-bold">
          {title}
        </h2>
        {actions}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost-outline" size="icon" aria-label="Note actions" className="shrink-0 border-muted-foreground/50">
              <DotsThree weight="bold" size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
            <DropdownMenuItem disabled={!onOpen} onSelect={onOpen}><ArrowsOut /> Open full screen</DropdownMenuItem>
            <DropdownMenuItem disabled={!onRename} onSelect={onRename}><PencilSimple /> Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={!canRemove} onSelect={onRemove}><Trash /> Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {children}
    </section>
  )
}
