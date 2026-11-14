import { useState } from 'react'
import { SearchInput } from './ui/search-input.jsx'
import BottomSheet from './BottomSheet.jsx'
import FileIcon from './FileIcon.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Button } from './ui/button.jsx'
import { TreeRow } from './NavTree.jsx'
import { folderRows } from '../lib/folderTree.js'
import { EmptyMessage } from './EmptyState.jsx'

// A sheet to pick one of `folders` ('' is the root) (Move to…, a board's folder): the folder tree,
// a tap selecting a folder and its button (`pickLabel`) picking it, until something is typed in the
// search field, then the matching folders as a list, a tap picking. `onPick(folder)` returns an
// error message, or null and the sheet closes. `children`: a note under the search field.
export default function FolderSheet({ title, folders, onPick, onClose, pickLabel = 'Select', children }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(() => new Set())
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q ? folders.filter(f => (f || 'root').toLowerCase().includes(q)) : folders

  // The root first (when listed), then the tree
  const treeRows = [
    ...(folders.includes('') ? [{ path: '', name: '(root)', depth: 0, branch: false, open: false, pickable: true }] : []),
    ...folderRows(folders, expanded),
  ]

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
          {q ? filtered.map(folder => (
            <li key={folder || '__root__'}>
              <ListRow icon={<FileIcon path={folder} dir />} title={folder || '(root)'} onClick={() => pick(folder)} />
            </li>
          )) : treeRows.map(({ path, name, depth, branch, open, pickable }) => (
            <li key={path || '__root__'}>
              <TreeRow
                depth={depth} branch={branch} open={open}
                onToggle={() => setExpanded(prev => { const next = new Set(prev); if (!next.delete(path)) next.add(path); return next })}
                row={{
                  icon: <FileIcon path={path} dir />,
                  title: name,
                  active: selected === path,
                  disabled: !pickable,
                  onClick: () => { setSelected(path); setError('') },
                  trailing: selected === path && <Button size="md" onClick={() => pick(path)}>{pickLabel}</Button>,
                }}
              />
            </li>
          ))}
          {(q ? filtered : treeRows).length === 0 && (
            <EmptyMessage size="sm">No folders found</EmptyMessage>
          )}
        </ul>
      </div>
    </BottomSheet>
  )
}
