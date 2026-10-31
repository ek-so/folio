import { useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Check, MagnifyingGlass } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import ItemMenu from './ItemMenu.jsx'
import PathBreadcrumbs from './PathBreadcrumbs.jsx'
import Spinner from './Spinner.jsx'
import MarkdownPreview from './MarkdownPreview.jsx'
import MarkdownEditor from './MarkdownEditor.jsx'
import { useNote } from '../hooks/useNote.js'
import { displayName } from '../lib/files.js'
import PageLayout from './PageLayout.jsx'

// A note: shown as preview; tapping text edits its markdown there. Edits
// save on their own; ✓ (in the footer, above the keyboard) only switches back to preview.
export default function Editor({ path, root, entry, files, edited, onEdit, onNavigate, onOpenFile, onRename, onDelete, onMove, folders, syncButton, onSearch }) {
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
    <PageLayout>
      <Header
        start={
          <div className="flex-1 min-w-0">
            <PathBreadcrumbs root={root} path={path} current={fileName} changed={ready && edited !== undefined} onNavigate={onNavigate} />
          </div>
        }
      >
        <Button variant="ghost-outline" size="icon" aria-label="Search" className="shrink-0 border-muted-foreground/50" onClick={onSearch}>
          <MagnifyingGlass />
        </Button>
        <ItemMenu item={{ name: path.split('/').pop(), path, type: 'file' }} onRename={onRename} onDelete={onDelete} onMove={onMove} folders={folders} />
      </Header>
      <div className="flex flex-col flex-1 min-h-0 max-w-[1000px] mx-auto w-full">
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
          <MarkdownPreview content={content} path={path} files={files} scrollTo={editedAt} onTap={startEditing} onOpenFile={onOpenFile} onNavigate={onNavigate} />
        )}
      </div>
      <Footer>
        {mode === 'edit' && (
          <Button size="icon" onClick={finishEditing} aria-label="Done" className="shrink-0">
            <Check />
          </Button>
        )}
        {syncButton}
      </Footer>
    </PageLayout>
  )
}
