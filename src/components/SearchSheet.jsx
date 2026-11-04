import { useState, useRef } from 'react'
import { Input } from './ui/input.jsx'
import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'
import { splitName } from '../lib/changes.js'
import FileIcon from './FileIcon.jsx'

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
                    <Button
                      variant="ghost"
                      className="w-full h-auto min-h-control justify-start gap-3 py-2 font-normal text-left"
                      onClick={() => select(path)}
                    >
                      <FileIcon path={path} />
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5 text-sm truncate">
                          {base}
                          {hasEdit && <span className="inline-block size-1.5 rounded-full bg-primary shrink-0" />}
                        </span>
                        {folder && <span className="block text-xs text-muted-foreground truncate">{folder}</span>}
                      </span>
                    </Button>
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
