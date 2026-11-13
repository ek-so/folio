import { useState, useRef, useContext } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import BottomSheet from './BottomSheet.jsx'
import TitleNameFields from './TitleNameFields.jsx'
import { useTitleName } from '../hooks/useTitleName.js'
import { splitName, renameTarget } from '../lib/changes.js'
import { LinksContext } from '../hooks/useLinkIndex.js'
import { plural } from '../lib/plural.js'

// kind: what's renamed when it's not a file or folder (a view): no file extension, no links to update
// A note on this device (`titleOf` of LinksContext) is renamed with its Title and File name together (`TitleNameFields`):
// `placeholder`: the name an emptied field falls back to (a widget's own name is optional): shown in the empty field, and Save stays on, passing ''.
// `onRename(name, title)` (`title` undefined when it's unchanged); anything else has the one name field and `onRename(name)`.
export default function RenameModal({ item, onRename, onClose, kind, placeholder }) {
  const isDir = item.type === 'dir'
  const [currentName, ext] = isDir ? [item.name, ''] : splitName(item.name)
  const linkInfo = useContext(LinksContext)
  const noteTitle = !kind && ext === '.md' ? linkInfo?.titleOf(item.path) : undefined // undefined: not a note we can retitle
  const withTitle = noteTitle !== undefined
  const fields = useTitleName(noteTitle ?? '', currentName)
  const [plainName, setName] = useState(currentName)
  const name = withTitle ? fields.name : plainName
  const [error, setError] = useState('')
  const inputRef = useRef()
  const trimmed = name.trim()
  const linkCount = !kind && trimmed && trimmed !== currentName && linkInfo
    ? linkInfo.rewriteCount(item, renameTarget(item, trimmed)) : 0

  function handleRename(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (withTitle ? !fields.changed : trimmed === currentName) return onClose()
    setError((withTitle ? onRename(trimmed, fields.title.trim() === noteTitle ? undefined : fields.title.trim()) : onRename(trimmed)) || '')
  }

  return (
    <BottomSheet
      title={`Rename ${kind ?? (isDir ? 'folder' : ext === '.md' ? 'note' : 'file')}`}
      onClose={onClose}
      onOpenAutoFocus={e => { e.preventDefault(); inputRef.current?.select() }}
    >
      <form onSubmit={handleRename} className="flex flex-col gap-3">
        {withTitle ? <TitleNameFields fields={fields} ext={ext} onEdit={() => setError('')} /> : (
          <div className="flex items-center gap-space-sm">
            <Input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder={placeholder}
              autoCorrect="off"
              className="bg-background border-border"
            />
            {ext && <span className="text-muted-foreground shrink-0">{ext}</span>}
          </div>
        )}
        {error && <p className="text-destructive-ink text-xs">{error}</p>}
        {linkCount > 0 && (
          <p className="text-muted-foreground text-xs">Also updates links in {plural(linkCount, 'note')}.</p>
        )}
        <div className="flex justify-end gap-space-sm">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={(!name.trim() && placeholder === undefined) || (withTitle && !fields.title.trim())}>Save</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
