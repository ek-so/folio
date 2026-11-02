import { useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Check } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import Spinner from './Spinner.jsx'
import FilePage from './FilePage.jsx'
import MarkdownPreview from './MarkdownPreview.jsx'
import Backlinks from './Backlinks.jsx'
import MarkdownEditor from './MarkdownEditor.jsx'
import { useNote } from '../hooks/useNote.js'
import { displayName } from '../lib/files.js'

// A note: shown as preview; tapping text edits its markdown there. Edits
// save on their own; ✓ in the footer only switches back to preview.
export default function Editor({ path, root, entry, files, edited, onEdit, onNavigate, onOpenFile, onRename, onDelete, onMove, folders, syncButton, onSearch, backlinks }) {
  const { content, change, loading, loadError } = useNote(entry, edited, onEdit)
  const [mode, setMode] = useState('preview')
  const [editedAt, setEditedAt] = useState(null) // offset to show when back in preview
  const textareaRef = useRef()

  // Inside the tap, so the textarea gets focus and mobile keyboards open
  function startEditing(pos) {
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
      actions={<>
        {mode === 'edit' && (
          <Button size="icon" onClick={finishEditing} aria-label="Done" className="shrink-0">
            <Check />
          </Button>
        )}
        {syncButton}
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
          content={content} path={path} files={files} scrollTo={editedAt}
          onTap={startEditing} onChange={change} onOpenFile={onOpenFile} onNavigate={onNavigate}
          footer={<Backlinks links={backlinks} onOpen={onOpenFile} />}
        />
      )}
    </FilePage>
  )
}
