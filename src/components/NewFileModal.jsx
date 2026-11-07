import { useState } from 'react'
import { Button } from './ui/button.jsx'
import { Label } from './ui/label.jsx'
import { Input } from './ui/input.jsx'
import BottomSheet from './BottomSheet.jsx'
import { nameFromTitle } from '../lib/changes.js'

// Creates the note or folder locally; it reaches GitHub on the next sync.
// kind 'view': a new view in the navigation; an empty name is fine (it shows as a light Untitled).
// `titled` (a board's new card, titled New card): a Title field first, then the File name, which follows the
// title until it's typed in; `onCreate(name, title)`.
export default function NewFileModal({ folder, kind, titled, onCreate, onClose }) {
  const isFolder = kind === 'folder'
  const isView = kind === 'view'
  const [title, setTitle] = useState('')
  const [typedName, setTypedName] = useState(null) // the file name once typed in, else it follows the title
  const [error, setError] = useState('')
  const name = typedName ?? (titled ? nameFromTitle(title) : '')
  const setName = value => { setTypedName(value); setError('') }

  function handleCreate(e) {
    e.preventDefault()
    setError(onCreate(name.trim(), title.trim()) || '')
  }

  const nameInput = (
    <Input
      type="text"
      placeholder={isView ? 'Untitled' : isFolder ? 'Folder name' : titled ? 'File name' : 'Note name'}
      aria-label={titled ? 'File name' : undefined}
      value={name}
      onChange={e => setName(e.target.value)}
      autoCorrect="off"
      autoCapitalize="words"
      className="bg-background border-border font-normal"
    />
  )

  return (
    <BottomSheet
      title={isView ? 'New view' : isFolder ? 'New folder' : titled ? 'New card' : 'New note'}
      description={folder ? `in ${folder}` : undefined}
      onClose={onClose}
    >
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        {titled ? <>
          <Label className="flex-col items-start gap-1.5 leading-5">
            Title
            <Input type="text" placeholder="Title" value={title} onChange={e => { setTitle(e.target.value); setError('') }} autoCorrect="off" autoCapitalize="sentences" className="bg-background border-border font-normal" />
          </Label>
          <Label className="flex-col items-start gap-1.5 leading-5">
            File name
            {nameInput}
          </Label>
        </> : nameInput}
        {error && <p className="text-destructive-ink text-xs">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!isView && !name.trim()}>Create</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
