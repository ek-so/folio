import { useEffect, useRef, useState } from 'react'
import { ArrowsLeftRight } from '@phosphor-icons/react'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu.jsx'
import MarkdownPreview, { DOUBLE_TAP_MS, OWN_CLICKS } from '@/components/MarkdownPreview.jsx'
import WidgetFrame from '@/components/WidgetFrame.jsx'
import { EmptyMessage } from '@/components/EmptyState.jsx'
import { useOverflows } from '@/hooks/useOverflows.js'
import { editNote } from '@/lib/changes.js'
import { cn, isPortaled } from '@/lib/utils.js'
import { PinPicker } from '../pinned/PinnedSetup.jsx'
import { noteSettings, noteWrite, notePath, noteWidgetTitle } from './note.js'

// The Note widget (note.js): the note's title (its own Rename overrides it) and its ⋯ (Change note…, Rename, Remove
// widget) on top, then one card with the note's markdown as a preview (MarkdownPreview), capped in height (`max-h-96`):
// what doesn't fit fades out at the bottom. Its links, checkboxes and badges work as in the note; any other tap opens
// the note, a double tap opens it in the editor at the tapped word (`editFile`). A gone note's card is dashed: a tap
// picks another.
export default function NoteWidget({ id, services, onRemove }) {
  const file = services.config.read(notePath(id))
  const settings = noteSettings(services.config.read, id)
  const canEdit = services.canEdit && !!settings
  const [picking, setPicking] = useState(false)
  const pick = (path, first = ch => ch) => { setPicking(false); services.update(ch => noteWrite(services.config, id, { path })(first(ch))) }

  const menu = <DropdownMenuItem disabled={!canEdit} onSelect={() => setPicking(true)}><ArrowsLeftRight /> Change note…</DropdownMenuItem>

  return <>
    <WidgetFrame
      title={noteWidgetTitle(settings, services.notes)} noun="Note widget" menu={menu} onRemove={onRemove} canEdit={services.canEdit}
      ready={file.ready} readable={!!settings}
    >{() => <NotePreviewCard path={settings.path} services={services} onReplace={canEdit ? () => setPicking(true) : null} />}</WidgetFrame>
    {picking && <PinPicker services={services} withFolders={false} title="Select note" onPick={pick} onClose={() => setPicking(false)} />}
  </>
}

// The note's card. A tap waits for a second one before opening the note, so a double tap only edits it
function NotePreviewCard({ path, services, onReplace }) {
  const [el, setEl] = useState(null)
  const overflows = useOverflows(el)
  const timer = useRef(null) // a first tap's, opening the note unless a second comes
  const edited = useRef(false) // the preview took this tap as a double tap
  useEffect(() => () => clearTimeout(timer.current), [])
  const found = services.files.includes(path)
  const text = services.notes[path]
  const locked = services.locked(path)

  const edit = (offset = 0) => {
    clearTimeout(timer.current)
    timer.current = null
    edited.current = true
    services.editFile(path, offset)
  }
  const onClick = e => {
    if (isPortaled(e)) return
    if (edited.current) { edited.current = false; return }
    if (!found) return onReplace?.()
    if (e.target.closest(`${OWN_CLICKS}, input, button`)) return
    if (timer.current) return edit() // a second tap the preview didn't count (too far from the first)
    timer.current = setTimeout(() => { timer.current = null; services.openFile(path) }, DOUBLE_TAP_MS)
  }

  return (
    <div
      ref={setEl}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (found) services.openFile(path); else onReplace?.() } }}
      onClick={onClick}
      className={cn('relative max-h-96 cursor-pointer overflow-hidden rounded-lg border border-border bg-card outline-none hover-lift focus-visible:ring-1 focus-visible:ring-ring', !found && 'border-dashed border-muted-foreground/50')}
    >
      {!found ? (
        <EmptyMessage>This note is gone.{onReplace ? ' Tap to select another.' : ''}</EmptyMessage>
      ) : text === undefined ? (
        <EmptyMessage>This note isn't saved on this device yet.</EmptyMessage>
      ) : (
        <MarkdownPreview
          content={text} path={path} files={services.entries}
          onDoubleTap={edit}
          onChange={locked ? undefined : next => services.update(ch => editNote(ch, services.remoteFiles, path, () => next, services.remoteText))}
          onOpenFile={services.openFile} onNavigate={services.openFolder}
        />
      )}
      {overflows && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />}
    </div>
  )
}
