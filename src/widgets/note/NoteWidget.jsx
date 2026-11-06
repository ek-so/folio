import { useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import { DotsThree, Trash, PencilSimple, Check, ArrowsOut } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import Spinner from '@/components/Spinner.jsx'
import MarkdownPreview from '@/components/MarkdownPreview.jsx'
import MarkdownEditor from '@/components/MarkdownEditor.jsx'
import { useNote } from '@/hooks/useNote.js'
import { displayName } from '@/lib/files.js'
import { noteTitle } from '@/lib/frontmatter.js'
import { notePath, parseNote } from './note.js'

// A note widget (note.js): the note's title, Edit (✓ when done), Open full screen and ⋯ on top,
// then its text in a box of fixed height that scrolls inside. Edits save on their own, like on
// the note's own page; opening it full screen is opening the note, as a board's card does.
export default function NoteWidget({ id, services, onRemove }) {
  const file = services.config.read(notePath(id))
  const note = file.ready && file.text !== undefined ? parseNote(file.text) : null
  const path = note?.file
  const found = path && services.noteFile(path)
  const open = () => { window.dispatchEvent(new Event('folio:flush')); services.openFile(path) } // typing first

  const frame = (title, body, actions) => (
    <Frame title={title} onOpen={found ? open : undefined} actions={actions} canRemove={services.canEdit} onRemove={onRemove}>{body}</Frame>
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

  // Inside the tap, so the textarea gets focus and mobile keyboards open
  function startEditing() {
    flushSync(() => setEditing(true))
    textareaRef.current?.setSelectionRange(0, 0)
    textareaRef.current?.focus()
  }

  const title = noteTitle(ready ? content : services.notes[path] ?? '', displayName(path))
  const actions = editing ? (
    <Button variant="success" size="icon" aria-label="Done" tooltip="Done" className="shrink-0" onClick={() => setEditing(false)}><Check /></Button>
  ) : (
    <Button variant="ghost-outline" size="icon" aria-label="Edit" tooltip="Edit" disabled={!ready} className="shrink-0 border-muted-foreground/50" onClick={startEditing}><PencilSimple /></Button>
  )
  const body = loading ? <div className="flex flex-1 items-center justify-center"><Spinner /></div>
    : loadError ? <p className="px-6 py-12 text-center text-sm text-muted-foreground">Couldn't open this note. It isn't saved on this device yet — connect to the internet and pull to refresh.</p>
    : editing ? <MarkdownEditor ref={textareaRef} content={content} onChange={change} onDone={() => setEditing(false)} />
    : <MarkdownPreview content={content} path={path} files={services.virtual} onChange={change} onOpenFile={services.openFile} onNavigate={services.openFolder} />
  return frame(title, <div data-no-pull className="flex h-80 flex-col overflow-hidden rounded-lg border border-border bg-card">{body}</div>, actions)
}

// The widget's title row over `children`: tapping the title opens the note full screen (`onOpen`)
function Frame({ title, onOpen, actions, canRemove, onRemove, children }) {
  return (
    <section className="flex shrink-0 flex-col gap-space-sm">
      <div className="flex min-h-control items-center gap-space-sm">
        <h2 className="min-w-0 flex-1 truncate px-space-xs text-base font-bold">
          {onOpen ? <button type="button" className="max-w-full truncate text-left hover:underline" onClick={onOpen}>{title}</button> : title}
        </h2>
        {actions}
        {onOpen && <Button variant="ghost-outline" size="icon" aria-label="Open full screen" tooltip="Open full screen" className="shrink-0 border-muted-foreground/50" onClick={onOpen}><ArrowsOut /></Button>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost-outline" size="icon" aria-label="Note actions" className="shrink-0 border-muted-foreground/50">
              <DotsThree weight="bold" size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
            <DropdownMenuItem disabled={!onOpen} onSelect={onOpen}><ArrowsOut /> Open full screen</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={!canRemove} onSelect={onRemove}><Trash /> Remove note widget</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {children}
    </section>
  )
}
