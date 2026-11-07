import { useState, useRef, useContext } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import BottomSheet from './BottomSheet.jsx'
import { splitName, renameTarget } from '../lib/changes.js'
import { LinksContext } from '../hooks/useLinkIndex.js'

// kind: what's renamed when it's not a file or folder (a view): no file extension, no links to update
export default function RenameModal({ item, onRename, onClose, kind }) {
  const isDir = item.type === 'dir'
  const [currentName, ext] = isDir ? [item.name, ''] : splitName(item.name)
  const [name, setName] = useState(currentName)
  const [error, setError] = useState('')
  const inputRef = useRef()
  const linkInfo = useContext(LinksContext)
  const trimmed = name.trim()
  const linkCount = !kind && trimmed && trimmed !== currentName && linkInfo
    ? linkInfo.rewriteCount(item, renameTarget(item, trimmed)) : 0

  function handleRename(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed === currentName) return onClose()
    setError(onRename(trimmed) || '')
  }

  return (
    <BottomSheet
      title={`Rename ${kind ?? (isDir ? 'folder' : ext === '.md' ? 'note' : 'file')}`}
      onClose={onClose}
      onOpenAutoFocus={e => { e.preventDefault(); inputRef.current?.select() }}
    >
      <form onSubmit={handleRename} className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            autoCorrect="off"
            className="bg-background border-border"
          />
          {ext && <span className="text-muted-foreground shrink-0">{ext}</span>}
        </div>
        {error && <p className="text-destructive-ink text-xs">{error}</p>}
        {linkCount > 0 && (
          <p className="text-muted-foreground text-xs">Also updates links in {linkCount} note{linkCount === 1 ? '' : 's'}.</p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()}>Save</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
