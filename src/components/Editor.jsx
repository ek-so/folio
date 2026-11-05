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
import { displayName } from '../lib/files.js'
import { frontMatter, withValue, valuesOf } from '../lib/frontmatter.js'
import PropertyBadges from './PropertyBadges.jsx'

// A note: its file name in the TitleBar (editing it renames the file), the
// whole markdown shown as preview; ✏️ in the title bar edits the markdown,
// starting where you were reading, and a double tap starts at the tapped
// word. Edits save on their own; ✓ (same spot) only switches back to preview.
export default function Editor({ linkedBy, onOpenLink, path, entry, files, notes, edited, onEdit, onNavigate, onOpenFile, onRename, onDelete, onMove, folders, backlinks }) {
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

  // What the notes right next to this one have as a property, to choose from
  const dir = path.slice(0, path.lastIndexOf('/') + 1)
  const nearby = key => valuesOf(Object.entries(notes).filter(([p]) => p.startsWith(dir) && !p.slice(dir.length).includes('/')).map(([, t]) => t), key)

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
      onDelete={onDelete}
      onMove={onMove}
      folders={folders}
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
        <MarkdownEditor ref={textareaRef} content={content} onChange={change} onDone={finishEditing} />
      ) : (
        <MarkdownPreview
          ref={previewRef}
          content={content} path={path} files={files} scrollTo={editedAt}
          onDoubleTap={startEditing} onChange={change} onOpenFile={onOpenFile} onNavigate={onNavigate}
          footer={<Backlinks links={backlinks} onOpen={onOpenFile} />}
        >
          <PropertyBadges props={frontMatter(content)?.props ?? []} path={path} files={files} title="Properties" onChange={(key, value) => change(withValue(content, key, value))} options={nearby} className="px-space pt-space" />
        </MarkdownPreview>
      )}
    </FilePage>
  )
}
