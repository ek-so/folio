import { useState } from 'react'
import { SearchInput } from './ui/search-input.jsx'
import BottomSheet from './BottomSheet.jsx'
import FileIcon from './FileIcon.jsx'
import { ListRow } from './ui/list-row.jsx'
import { EmptyMessage } from './EmptyState.jsx'

// A sheet listing `folders` ('' is the root) with a search field, to pick one
// (Move to…, a board's folder). `onPick(folder)` returns an error message, or
// null and the sheet closes. `children`: a note under the search field.
export default function FolderSheet({ title, folders, onPick, onClose, children }) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q ? folders.filter(f => (f || 'root').toLowerCase().includes(q)) : folders

  function pick(folder) {
    const err = onPick(folder)
    if (!err) onClose()
    else setError(err)
  }

  return (
    <BottomSheet
      title={title}
      onClose={onClose}
      onOpenAutoFocus={e => { e.preventDefault(); e.currentTarget?.querySelector('input')?.focus() }}
    >
      <div className="flex flex-col gap-3">
        <SearchInput
          placeholder="Search folders…"
          value={query}
          onChange={e => { setQuery(e.target.value); setError('') }}
          className="bg-background border-border"
        />
        {error && <p className="text-destructive-ink text-xs">{error}</p>}
        {children}
        <ul className="flex flex-col gap-0.5 max-h-64 overflow-y-auto -mx-space-xs">
          {filtered.map(folder => (
            <li key={folder || '__root__'}>
              <ListRow icon={<FileIcon path={folder} dir />} title={folder || '(root)'} onClick={() => pick(folder)} />
            </li>
          ))}
          {filtered.length === 0 && (
            <EmptyMessage size="sm">No folders found</EmptyMessage>
          )}
        </ul>
      </div>
    </BottomSheet>
  )
}
