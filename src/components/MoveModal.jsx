import { useState } from 'react'
import { Folder } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import BottomSheet from './BottomSheet.jsx'

export default function MoveModal({ item, folders, onMove, onClose }) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const itemFolder = item.path.includes('/') ? item.path.slice(0, item.path.lastIndexOf('/')) : ''

  const available = ['', ...folders].filter(f => {
    if (f === itemFolder) return false
    if (item.type === 'dir') {
      if (f === item.path) return false
      if (f.startsWith(item.path + '/')) return false
    }
    return true
  })

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
        <ul className="flex flex-col gap-0.5 max-h-64 overflow-y-auto -mx-1">
          {filtered.map(folder => (
            <li key={folder || '__root__'}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 font-normal"
                onClick={() => handleMove(folder)}
              >
                <Folder />
                <span className="truncate text-left">{folder || '(root)'}</span>
              </Button>
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
