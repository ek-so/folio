import { useState, useRef } from 'react'
import { Input } from './ui/input.jsx'
import BottomSheet from './BottomSheet.jsx'
import { splitName } from '../lib/changes.js'
import FileIcon from './FileIcon.jsx'
import { ListRow } from './ui/list-row.jsx'

// Command-palette style search. Shows recently opened files when no query is typed,
// then filters every visible file in the repo (notes, images, PDFs, …) by path.
export default function SearchSheet({ onClose, onSelect, virtual, changes, recent }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef()

  const q = query.trim().toLowerCase()
  // Same visibility as the file list: everything but folder placeholders
  const allFiles = Object.keys(virtual || {}).filter(p => !p.endsWith('/.gitkeep') && p !== '.gitkeep')
  const recentFiles = (recent || []).filter(p => p in (virtual || {}))

  const results = q
    ? allFiles.filter(p => p.toLowerCase().includes(q)).slice(0, 30)
    : recentFiles.slice(0, 12)

  function select(path) {
    onSelect(path)
    onClose()
  }

  return (
    <BottomSheet
      title="Search"
      onClose={onClose}
      onOpenAutoFocus={e => { e.preventDefault(); inputRef.current?.focus() }}
    >
      <div className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search files…"
          autoCorrect="off"
          autoCapitalize="off"
          className="bg-background border-border"
        />
        <div className="overflow-y-auto max-h-64 -mx-1" data-no-pull>
          {!q && recentFiles.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No recent files</p>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No files found</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {results.map(path => {
                const parts = path.split('/')
                const fileName = parts.pop()
                const [base] = splitName(fileName)
                const folder = parts.join('/')
                // Edits are keyed by the file's original path, which differs after a rename
                const hasEdit = changes?.edits && virtual[path]?.orig in changes.edits
                return (
                  <li key={path}>
                    <ListRow icon={<FileIcon path={path} />} title={base} changed={hasEdit} description={folder} onClick={() => select(path)} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
