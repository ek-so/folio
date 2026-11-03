import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { Check, PencilSimple } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import Spinner from './Spinner.jsx'
import FilePage from './FilePage.jsx'
import MarkdownPreview from './MarkdownPreview.jsx'
import Backlinks from './Backlinks.jsx'
import SymlinkNotice from './SymlinkNotice.jsx'
import MarkdownEditor from './MarkdownEditor.jsx'
import { useNote } from '../hooks/useNote.js'
import { displayName } from '../lib/files.js'

const LOCKED = 'To edit this file, edit the source'

// A note: shown as preview; ✏️ in the footer edits its markdown, starting
// where you were reading, and a double tap starts at the tapped word. Edits save on their own; ✓ (same spot) only
// switches back to preview. With `source` (the note is a symlink, `entry`
// the source's) it's read-only, with a link to the source above it.
export default function Editor({ menu, source, path, root, entry, files, edited, onEdit, onNavigate, onOpenFile, onRename, onDelete, onMove, folders, syncButton, onSearch, backlinks }) {
  const { content, change, loading, loadError } = useNote(entry, edited, onEdit)
  const [mode, setMode] = useState('preview')
  const [editedAt, setEditedAt] = useState(null) // offset to show when back in preview
  const textareaRef = useRef()
  const previewRef = useRef()
  const [lockedTip, setLockedTip] = useState(false) // "edit the source" bubble on a symlink
  useEffect(() => {
    if (!lockedTip) return
    const t = setTimeout(() => setLockedTip(false), 2000)
    return () => clearTimeout(t)
  }, [lockedTip])

  // Inside the tap, so the textarea gets focus and mobile keyboards open
  // `pos`: markdown offset to put the cursor at (a double tap); ✏️ starts at
  // the first block on screen
  function startEditing(pos = previewRef.current?.visibleOffset() ?? 0) {
    flushSync(() => setMode('edit'))
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.setSelectionRange(pos, pos)
    textarea.focus()
  }

  function finishEditing() {
    setEditedAt(textareaRef.current?.selectionStart ?? null)
    setMode('preview')
  }

  const fileName = displayName(path)
  const ready = !loading && !loadError

  return (
    <FilePage
      menu={menu}
      path={path}
      root={root}
      name={fileName}
      changed={ready && edited !== undefined}
      onNavigate={onNavigate}
      onRename={onRename}
      onDelete={onDelete}
      onMove={onMove}
      folders={folders}
      onSearch={onSearch}
      syncButton={syncButton}
      actions={<>
        {mode === 'edit' ? (
          <Button size="icon" onClick={finishEditing} aria-label="Done" className="shrink-0">
            <Check />
          </Button>
        ) : ready && source ? (
          // A symlink can't be edited here: greyed ✏️, tapping (or hovering) explains
          <span className="relative" title={LOCKED}>
            <Button size="icon" aria-disabled="true" aria-label={LOCKED} onClick={() => setLockedTip(true)} className="shrink-0 opacity-50">
              <PencilSimple />
            </Button>
            {lockedTip && (
              <span className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-sm text-foreground shadow-md">
                {LOCKED}
              </span>
            )}
          </span>
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
        <MarkdownEditor ref={textareaRef} content={content} onChange={change} onDone={finishEditing} />
      ) : (
        <MarkdownPreview
          ref={previewRef}
          content={content} path={source ?? path} files={files} scrollTo={editedAt}
          onDoubleTap={source ? undefined : startEditing} onChange={source ? undefined : change}
          onOpenFile={onOpenFile} onNavigate={onNavigate}
          footer={<Backlinks links={backlinks} onOpen={onOpenFile} />}
        >
          {source && <SymlinkNotice source={source} onOpen={onOpenFile} />}
        </MarkdownPreview>
      )}
    </FilePage>
  )
}
