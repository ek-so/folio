import { useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Check, PencilSimple } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import Spinner from './Spinner.jsx'
import FilePage from './FilePage.jsx'
import MarkdownPreview from './MarkdownPreview.jsx'
import Backlinks from './Backlinks.jsx'
import MarkdownEditor from './MarkdownEditor.jsx'
import { useNote } from '../hooks/useNote.js'
import TitleBar from './TitleBar.jsx'
import { displayName, splitTitle, withTitle } from '../lib/files.js'

// A note: its "# title" in the TitleBar, edited there; the rest (the body)
// shown as preview; ✏️ in the footer edits the body's markdown, starting
// where you were reading, and a double tap starts at the tapped word. Edits save on their own; ✓ (same spot) only
// switches back to preview.
export default function Editor({ menu, path, root, entry, files, edited, onEdit, onNavigate, onOpenFile, onRename, onDelete, onMove, folders, syncButton, onSearch, backlinks }) {
  const { content, change, loading, loadError } = useNote(entry, edited, onEdit)
  const [mode, setMode] = useState('preview')
  const [editedAt, setEditedAt] = useState(null) // offset to show when back in preview
  const textareaRef = useRef()
  const previewRef = useRef()

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
  const { emoji, title, head, body } = splitTitle(content)
  const changeBody = text => change(head + text)

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
      title={
        <TitleBar
          path={path} emoji={emoji} value={title ?? ''} placeholder={fileName}
          onCommit={ready ? text => { change(withTitle(content, text)); return null } : undefined}
        />
      }
      actions={<>
        {mode === 'edit' ? (
          <Button size="icon" onClick={finishEditing} aria-label="Done" className="shrink-0">
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
        <MarkdownEditor ref={textareaRef} content={body} onChange={changeBody} onDone={finishEditing} />
      ) : (
        <MarkdownPreview
          ref={previewRef}
          content={body} path={path} files={files} scrollTo={editedAt}
          onDoubleTap={startEditing} onChange={changeBody} onOpenFile={onOpenFile} onNavigate={onNavigate}
          footer={<Backlinks links={backlinks} onOpen={onOpenFile} />}
        />
      )}
    </FilePage>
  )
}
