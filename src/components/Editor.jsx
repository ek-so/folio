import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { Check, PencilSimple, LockSimple, LockOpen, ArrowUUpLeft, ArrowUUpRight } from '@phosphor-icons/react'
import { Popover, PopoverAnchor, PopoverContent } from './ui/popover.jsx'
import { Button } from './ui/button.jsx'
import Loading from './Loading.jsx'
import FilePage from './FilePage.jsx'
import ColumnSubmenu from './ColumnSubmenu.jsx'
import MarkdownPreview from './MarkdownPreview.jsx'
import Backlinks from './Backlinks.jsx'
import MarkdownEditor from './MarkdownEditor.jsx'
import { useNote } from '../hooks/useNote.js'
import { useUndo } from '../hooks/useUndo.js'
import { displayName } from '../lib/files.js'
import { frontMatter, withValue, valueActions } from '../lib/frontmatter.js'
import PropertyBadges from './PropertyBadges.jsx'
import { EmptyMessage } from './EmptyState.jsx'

// A note: its file name in the TitleBar (editing it renames the file), the
// whole markdown shown as preview; ✏️ in the title bar edits the markdown,
// starting where you were reading, and a double tap starts at the tapped
// word. While editing, Undo and Redo take the ⋯'s place (also Ctrl/⌘+Z, Shift+Ctrl/⌘+Z and Ctrl+Y: `useUndo`); a tap
// on them keeps the keyboard and the editor open. Edits save on their own; ✓ (same spot) switches back to preview, writing typed dates in one format.
// `locked` (lib/locks.js): nothing in it can be changed (no ✏️, double tap, ticks, list dragging, badges' values or
// links' edits); a lock icon takes ✏️'s place and unlocks it (`onToggleLock`, also Lock / Unlock in ⋯; none when the
// locks can't be saved). Renaming, moving and duplicating stay. A double tap on a locked note says so in a popover where it
// was tapped ("This note is locked", Unlock under it), with Unlock right there (the next double tap then edits). `editAt` ({ start, end }, a broken link's Open at
// link): once the note is read, it opens in the editor with that text selected (a locked note: the preview at that
// spot), then `onEditAtDone()`.
export default function Editor({ linkedBy, onOpenLink, path, entry, files, notes, onEditNotes, tagColors, edited, onEdit, onNavigate, onOpenFile, columns, valueScope, backlinks, locked, onToggleLock, editAt, onEditAtDone }) {
  const { content, change, loading, loadError, beginEdit, endEdit } = useNote(entry, edited, onEdit, valueScope?.required, valueScope?.order)
  const [mode, setMode] = useState('preview')
  const [editedAt, setEditedAt] = useState(null) // offset to show when back in preview
  const [lockedTap, setLockedTap] = useState(null) // { x, y }: a double tap on the locked note, answered there
  const textareaRef = useRef()
  const previewRef = useRef()
  const history = useUndo(content, change)
  // After an undo or redo, the cursor at the end of what changed
  const restore = at => {
    if (at === null) return
    requestAnimationFrame(() => { textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(at, at) })
  }
  const keepFocus = e => e.preventDefault() // a tap on Undo or Redo doesn't take the focus out of the text

  // Inside the tap, so the textarea gets focus and mobile keyboards open
  // `pos`: markdown offset to put the cursor at (a double tap); ✏️ starts at
  // the first block on screen. `end`: the end of the text to select from `pos`
  function startEditing(pos = previewRef.current?.visibleOffset() ?? 0, end = pos) {
    beginEdit()
    flushSync(() => setMode('edit'))
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.setSelectionRange(pos, end)
    textarea.focus()
  }

  // The dates typed meanwhile are written as "17 Oct 2026, 14:30" on the way out (useNote)
  function finishEditing() {
    endEdit()
    setEditedAt(textareaRef.current?.selectionStart ?? null)
    setMode('preview')
  }

  // The notes right next to this one, or all of `valueScope`'s ({ name, includes(path) }: a board it's a card of),
  // this one as it is now: what they have as a property is what the badges offer
  const dir = path.slice(0, path.lastIndexOf('/') + 1)
  const inScope = valueScope?.includes ?? (p => p.startsWith(dir) && !p.slice(dir.length).includes('/'))
  const nearby = Object.keys(notes).filter(inScope)
  const nearbyTexts = nearby.map(p => p === path ? content : notes[p])
  // Their values' actions (lib/frontmatter.js `valueActions`): this note as an edit (its text may have typing
  // not saved yet), the others and the color through the app in one step
  const values = valueActions(nearbyTexts, (edit, first) => {
    const edited = edit(content)
    if (edited !== content) change(edited)
    onEditNotes(nearby.filter(p => p !== path), edit, first)
  }, tagColors.set)

  // Locked while editing (from ⋯): back to the preview, its typing saved
  useEffect(() => { if (locked && mode === 'edit') finishEditing() }, [locked])
  const changeUnlocked = locked ? undefined : change // nothing changes a locked note

  const fileName = displayName(path)
  const ready = !loading && !loadError

  // Open at link: the link selected in the editor, once the note is read
  useEffect(() => {
    if (!editAt || !ready) return
    const start = Math.min(editAt.start, content.length)
    if (locked) setEditedAt(start)
    else queueMicrotask(() => startEditing(start, Math.min(editAt.end, content.length))) // after this commit: it flushes a render
    onEditAtDone()
  }, [editAt, ready])

  return (
    <FilePage
      linkedBy={linkedBy}
      onOpenLink={onOpenLink}
      path={path}
      name={fileName}
      changed={ready && edited !== undefined}
      extra={columns && !locked && <ColumnSubmenu columns={columns.columns} column={columns.column} onSelect={columns.onSelect} />}
      menu={mode !== 'edit'}
      actions={<>
        {mode === 'edit' && !locked && <>
          <Button variant="ghost-outline" size="icon" aria-label="Undo" tooltip="Undo" disabled={!history.canUndo} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => restore(history.undo())}>
            <ArrowUUpLeft />
          </Button>
          <Button variant="ghost-outline" size="icon" aria-label="Redo" tooltip="Redo" disabled={!history.canRedo} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => restore(history.redo())}>
            <ArrowUUpRight />
          </Button>
        </>}
        {locked ? (
          <Button variant="ghost-outline" size="icon" aria-label="Unlock" tooltip="Locked: tap to unlock" disabled={!onToggleLock} onClick={onToggleLock}>
            <LockSimple />
          </Button>
        ) : mode === 'edit' ? (
          <Button variant="success" size="icon" onClick={finishEditing} aria-label="Done" className="shrink-0">
            <Check />
          </Button>
        ) : ready && (
          <Button size="icon" onClick={() => startEditing()} aria-label="Edit" className="shrink-0">
            <PencilSimple />
          </Button>
        )}
      </>}
    >
      {loading || loadError ? (
        loading ? (
          <Loading kind="text" />
        ) : (
          <EmptyMessage size="lg" className="px-space">
            Couldn't open this note. It isn't saved on this device yet — connect to the internet and pull to refresh.
          </EmptyMessage>
        )
      ) : mode === 'edit' ? (
        <MarkdownEditor ref={textareaRef} content={content} onChange={history.onChange} onUndo={() => restore(history.undo())} onRedo={() => restore(history.redo())} onDone={finishEditing} locked={valueScope?.locked} files={files} path={path} />
      ) : (
        <MarkdownPreview
          ref={previewRef}
          content={content} path={path} files={files} scrollTo={editedAt}
          onDoubleTap={locked ? (_, at) => setLockedTap(at) : startEditing} onChange={changeUnlocked} onOpenFile={onOpenFile} onNavigate={onNavigate}
          footer={<Backlinks links={backlinks} onOpen={onOpenFile} />}
        >
          <PropertyBadges props={ordered(frontMatter(content)?.props ?? [], valueScope?.order)} path={path} files={files} title="Properties" onChange={locked ? undefined : (key, value) => change(withValue(content, key, value))} options={values.options} onRemoveValue={locked ? undefined : values.removeValue} valueCount={values.count} scopeName={valueScope?.name ?? "this folder"} chosen={tagColors.colors} onEditValue={tagColors.canEdit && !locked ? values.editValue : undefined} badges={valueScope?.badges} hiddenValues={valueScope?.hidden} className="px-space pt-space" />
        </MarkdownPreview>
      )}
      <Popover open={Boolean(lockedTap && locked)} onOpenChange={open => { if (!open) setLockedTap(null) }}>
        {lockedTap && <PopoverAnchor className="fixed size-0" style={{ left: lockedTap.x, top: lockedTap.y }} />}
        <PopoverContent side="top" className="flex w-56 flex-col gap-space-xs" onOpenAutoFocus={e => e.preventDefault()}>
          {/* As the date picker's actions: a muted line, then the action as a full-width row */}
          <span className="px-3 pt-space-xs text-sm text-muted-foreground">This note is locked</span>
          <Button variant="ghost" className="w-full justify-start gap-space-sm px-3" disabled={!onToggleLock} onClick={() => { setLockedTap(null); onToggleLock() }}>
            <LockOpen /> Unlock
          </Button>
        </PopoverContent>
      </Popover>
    </FilePage>
  )
}

// A note's properties with the `order` ones first, in that order (a planner's description, date, repeat), the rest as in the file
function ordered(props, order = []) {
  const first = order.map(k => props.find(p => p.key === k)).filter(Boolean)
  return [...first, ...props.filter(p => !order.includes(p.key))]
}
