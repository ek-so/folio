import { useState } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import BottomSheet from './BottomSheet.jsx'

// Creates the note or folder locally; it reaches GitHub on the next sync.
// kind 'view': a new view in the navigation; an empty name is fine (it shows as a light Untitled).
export default function NewFileModal({ folder, kind, onCreate, onClose }) {
  const isFolder = kind === 'folder'
  const isView = kind === 'view'
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleCreate(e) {
    e.preventDefault()
    setError(onCreate(name.trim()) || '')
  }

  return (
    <BottomSheet
      title={isView ? 'New view' : isFolder ? 'New folder' : 'New note'}
      description={folder ? `in ${folder}` : undefined}
      onClose={onClose}
    >
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <Input
          type="text"
          placeholder={isView ? 'Untitled' : isFolder ? 'Folder name' : 'Note name'}
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          autoCorrect="off"
          autoCapitalize="words"
          className="bg-background border-border"
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!isView && !name.trim()}>Create</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
