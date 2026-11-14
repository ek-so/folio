import { useState } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import BottomSheet from './BottomSheet.jsx'
import TitleNameFields from './TitleNameFields.jsx'
import { useTitleName } from '../hooks/useTitleName.js'

// Creates the note or folder locally; it reaches GitHub on the next sync.
// A note asks for both its Title and its File name (`TitleNameFields`: the name follows the title until it's typed in);
// a folder or a view (`kind="view"`, one in the navigation) only its name. `onCreate(name, title)`.
export default function NewFileModal({ folder, kind, onCreate, onClose }) {
  const isFolder = kind !== 'note' // one name: a folder's or a view's
  const noun = kind === 'view' ? 'View' : 'Folder'
  const fields = useTitleName()
  const [folderName, setFolderName] = useState('')
  const [error, setError] = useState('')
  const name = isFolder ? folderName : fields.name
  const ready = name.trim() && (isFolder || fields.title.trim())

  function handleCreate(e) {
    e.preventDefault()
    setError(onCreate(name.trim(), fields.title.trim()) || '')
  }

  return (
    <BottomSheet
      title={`New ${kind}`}
      description={folder ? `in ${folder}` : undefined}
      onClose={onClose}
    >
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        {isFolder
          ? <Input type="text" placeholder={`${noun} name`} aria-label={`${noun} name`} value={folderName} onChange={e => { setFolderName(e.target.value); setError('') }} autoCorrect="off" autoCapitalize="words" className="bg-background border-border font-normal" />
          : <TitleNameFields fields={fields} onEdit={() => setError('')} />}
        {error && <p className="text-destructive-ink text-xs">{error}</p>}
        <div className="flex justify-end gap-space-sm">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!ready}>Create</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
