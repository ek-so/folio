import { useEffect, useRef, useState } from 'react'
import { ArrowsLeftRight, ArrowsVertical } from '@phosphor-icons/react'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import ResizeHandle from '@/components/ResizeHandle.jsx'
import MarkdownPreview, { DOUBLE_TAP_MS, OWN_CLICKS } from '@/components/MarkdownPreview.jsx'
import WidgetFrame from '@/components/WidgetFrame.jsx'
import { EmptyMessage } from '@/components/EmptyState.jsx'
import { useOverflows } from '@/hooks/useOverflows.js'
import { useIsDesktop } from '@/hooks/useIsDesktop.js'
import { clampSize, NOTE_HEIGHT } from '@/lib/resize.js'
import { editNote } from '@/lib/changes.js'
import { cn, isPortaled } from '@/lib/utils.js'
import { PinPicker } from '../pinned/PinnedSetup.jsx'
import { noteSettings, noteWrite, notePath, noteWidgetTitle } from './note.js'

// The Note widget (note.js): the note's title (its own Rename overrides it) and its ⋯ (Change note…, on a phone Change
// height…, Rename, Remove widget) on top, then one card with the note's markdown as a preview (MarkdownPreview; without
// the heading its title comes from, as that's the widget's title), at most its `height` tall: what doesn't fit fades out
// at the bottom. On desktop its bottom edge is dragged to change that (ResizeHandle; double click: the default); on a
// phone Change height… asks for it in pixels. Saved when let go, in its settings. Its links, checkboxes and badges work as in the note; any other tap opens
// the note, a double tap opens it in the editor at the tapped word (`editFile`). A gone note's card is dashed: a tap
// picks another.
export default function NoteWidget({ id, services, onRemove }) {
  const file = services.config.read(notePath(id))
  const settings = noteSettings(services.config.read, id)
  const canEdit = services.canEdit && !!settings
  const [picking, setPicking] = useState(false)
  const [sizing, setSizing] = useState(false) // Change height… is open
  const [dragged, setDragged] = useState(null) // the height while its edge is dragged
  const isDesktop = useIsDesktop()
  const save = next => services.update(noteWrite(services.config, id, next))
  const pick = (path, first = ch => ch) => { setPicking(false); services.update(ch => noteWrite(services.config, id, { ...settings, path })(first(ch))) }
  const resize = (px, done = true) => {
    const height = clampSize(px, NOTE_HEIGHT)
    if (!done) return setDragged(height)
    setDragged(null)
    if (height !== settings.height) save({ ...settings, height })
  }

  const menu = <>
    <DropdownMenuItem disabled={!canEdit} onSelect={() => setPicking(true)}><ArrowsLeftRight /> Change note…</DropdownMenuItem>
    {!isDesktop && <DropdownMenuItem disabled={!canEdit} onSelect={() => setSizing(true)}><ArrowsVertical /> Change height…</DropdownMenuItem>}
  </>

  return <>
    <WidgetFrame
      title={noteWidgetTitle(settings, services.notes)} noun="Note widget" menu={menu} onRemove={onRemove} canEdit={services.canEdit}
      ready={file.ready} readable={!!settings}
    >{() => (
      <div className="relative">
        <NotePreviewCard path={settings.path} height={dragged ?? settings.height} services={services} onReplace={canEdit ? () => setPicking(true) : null} />
        {isDesktop && canEdit && <ResizeHandle edge="bottom" label="Resize note" size={dragged ?? settings.height} limits={NOTE_HEIGHT} onResize={resize} />}
      </div>
    )}</WidgetFrame>
    {picking && <PinPicker services={services} withFolders={false} title="Select note" onPick={pick} onClose={() => setPicking(false)} />}
    {sizing && settings && <HeightSheet height={settings.height} onSave={height => { setSizing(false); resize(height) }} onClose={() => setSizing(false)} />}
  </>
}

// The note's card. A tap waits for a second one before opening the note, so a double tap only edits it
function NotePreviewCard({ path, height, services, onReplace }) {
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
      style={{ maxHeight: height }}
      className={cn('relative cursor-pointer overflow-hidden rounded-lg border border-border bg-card outline-none hover-lift focus-visible:ring-1 focus-visible:ring-ring', !found && 'border-dashed border-muted-foreground/50')}
    >
      {!found ? (
        <EmptyMessage>This note is gone.{onReplace ? ' Tap to select another.' : ''}</EmptyMessage>
      ) : text === undefined ? (
        <EmptyMessage>This note isn't saved on this device yet.</EmptyMessage>
      ) : (
        <MarkdownPreview
          content={text} path={path} files={services.entries} hideTitle
          onDoubleTap={edit}
          onChange={locked ? undefined : next => services.update(ch => editNote(ch, services.remoteFiles, path, () => next, services.remoteText))}
          onOpenFile={services.openFile} onNavigate={services.openFolder}
        />
      )}
      {overflows && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />}
    </div>
  )
}

// Change height…: the card's most, in pixels (NOTE_HEIGHT's limits)
function HeightSheet({ height, onSave, onClose }) {
  const [value, setValue] = useState(String(height))
  const n = Number(value)
  const valid = value.trim() !== '' && Number.isInteger(n) && n >= NOTE_HEIGHT.min && n <= NOTE_HEIGHT.max
  return (
    <BottomSheet title="Change height" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); if (valid) onSave(n) }} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note-height">Height in pixels</Label>
          <Input id="note-height" type="number" inputMode="numeric" min={NOTE_HEIGHT.min} max={NOTE_HEIGHT.max} value={value} onChange={e => setValue(e.target.value)} className="bg-background border-border font-normal" />
          <p className="text-muted-foreground text-xs">From {NOTE_HEIGHT.min} to {NOTE_HEIGHT.max}. The default is {NOTE_HEIGHT.default}.</p>
        </div>
        <div className="flex justify-end gap-space-sm">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!valid}>Save</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
