import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { Check, PencilSimple, LockSimple } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import Spinner from './Spinner.jsx'
import FilePage from './FilePage.jsx'
import MarkdownPreview from './MarkdownPreview.jsx'
import Backlinks from './Backlinks.jsx'
import MarkdownEditor from './MarkdownEditor.jsx'
import { useNote } from '../hooks/useNote.js'
import { displayName } from '../lib/files.js'
import { frontMatter, withValue, valueActions } from '../lib/frontmatter.js'
import PropertyBadges from './PropertyBadges.jsx'

// A note: its file name in the TitleBar (editing it renames the file), the
// whole markdown shown as preview; ✏️ in the title bar edits the markdown,
// starting where you were reading, and a double tap starts at the tapped
// word. Edits save on their own; ✓ (same spot) switches back to preview, writing typed dates in one format.
// `locked` (lib/locks.js): nothing in it can be changed (no ✏️, double tap, ticks, list dragging, badges' values or
// links' edits); a lock icon takes ✏️'s place and unlocks it (`onToggleLock`, also Lock / Unlock in ⋯; none when the
// locks can't be saved). Renaming, moving and duplicating stay.
export default function Editor({ linkedBy, onOpenLink, path, entry, files, notes, onEditNotes, tagColors, edited, onEdit, onNavigate, onOpenFile, onRename, onDuplicate, onDelete, onMove, folders, columns, valueScope, backlinks, locked, onToggleLock }) {
  const { content, change, loading, loadError, beginEdit, endEdit } = useNote(entry, edited, onEdit, valueScope?.required, valueScope?.order)
  const [mode, setMode] = useState('preview')
  const [editedAt, setEditedAt] = useState(null) // offset to show when back in preview
  const textareaRef = useRef()
  const previewRef = useRef()

  // Inside the tap, so the textarea gets focus and mobile keyboards open
  // `pos`: markdown offset to put the cursor at (a double tap); ✏️ starts at
  // the first block on screen
  function startEditing(pos = previewRef.current?.visibleOffset() ?? 0) {
    beginEdit()
    flushSync(() => setMode('edit'))
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.setSelectionRange(pos, pos)
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

  return (
    <FilePage
      linkedBy={linkedBy}
      onOpenLink={onOpenLink}
      path={path}
      name={fileName}
      changed={ready && edited !== undefined}
      onRename={onRename}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      onMove={onMove}
      folders={folders}
      columns={locked ? undefined : columns}
      lock={{ locked, onToggle: onToggleLock }}
      actions={<>
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
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-12 px-6">
            Couldn't open this note. It isn't saved on this device yet — connect to the internet and pull to refresh.
          </p>
        )
      ) : mode === 'edit' ? (
        <MarkdownEditor ref={textareaRef} content={content} onChange={change} onDone={finishEditing} locked={valueScope?.locked} />
      ) : (
        <MarkdownPreview
          ref={previewRef}
          content={content} path={path} files={files} scrollTo={editedAt}
          onDoubleTap={locked ? undefined : startEditing} onChange={changeUnlocked} onOpenFile={onOpenFile} onNavigate={onNavigate}
          footer={<Backlinks links={backlinks} onOpen={onOpenFile} />}
        >
          <PropertyBadges props={ordered(frontMatter(content)?.props ?? [], valueScope?.order)} path={path} files={files} title="Properties" onChange={locked ? undefined : (key, value) => change(withValue(content, key, value))} options={values.options} onRemoveValue={locked ? undefined : values.removeValue} valueCount={values.count} scopeName={valueScope?.name ?? "this folder"} chosen={tagColors.colors} onEditValue={tagColors.canEdit && !locked ? values.editValue : undefined} badges={valueScope?.badges} className="px-space pt-space" />
        </MarkdownPreview>
      )}
    </FilePage>
  )
}

// A note's properties with the `order` ones first, in that order (a planner's description, date, repeat), the rest as in the file
function ordered(props, order = []) {
  const first = order.map(k => props.find(p => p.key === k)).filter(Boolean)
  return [...first, ...props.filter(p => !order.includes(p.key))]
}
