import { useState, useContext } from 'react'
import { Input } from './ui/input.jsx'
import BottomSheet from './BottomSheet.jsx'
import FileIcon from './FileIcon.jsx'
import { ListRow } from './ui/list-row.jsx'
import { LinksContext } from '../hooks/useLinkIndex.js'
import { canMoveTo } from '../lib/changes.js'

export default function MoveModal({ item, folders, onMove, onClose }) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const linkedFrom = useContext(LinksContext)?.linkedFrom(item) ?? 0

  const available = ['', ...folders].filter(f => canMoveTo(item, f))

  const q = query.trim().toLowerCase()
  const filtered = q ? available.filter(f => (f || 'root').toLowerCase().includes(q)) : available

  function handleMove(folder) {
    const err = onMove(item, folder)
    if (!err) onClose()
    else setError(err)
  }

  return (
    <BottomSheet
      title={`Move "${item.name}" to…`}
      onClose={onClose}
      onOpenAutoFocus={e => { e.preventDefault(); e.currentTarget?.querySelector('input')?.focus() }}
    >
      <div className="flex flex-col gap-3">
        <Input
          placeholder="Search folders…"
          value={query}
          onChange={e => { setQuery(e.target.value); setError('') }}
          className="bg-background border-border"
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
        {linkedFrom > 0 && (
          <p className="text-muted-foreground text-xs">
            {linkedFrom} note{linkedFrom === 1 ? ' links' : 's link'} here; {linkedFrom === 1 ? 'its link' : 'their links'} will be updated.
          </p>
        )}
        <ul className="flex flex-col gap-0.5 max-h-64 overflow-y-auto -mx-1">
          {filtered.map(folder => (
            <li key={folder || '__root__'}>
              <ListRow icon={<FileIcon path={folder} dir />} title={folder || '(root)'} onClick={() => handleMove(folder)} />
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">No folders found</p>
          )}
        </ul>
      </div>
    </BottomSheet>
  )
}
