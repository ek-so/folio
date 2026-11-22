import { useState } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import BottomSheet, { SheetActions } from './BottomSheet.jsx'
import TitleNameFields from './TitleNameFields.jsx'
import { useTitleName } from '../hooks/useTitleName.js'
import { DateField } from './DateBadge.jsx'
import { Label } from './ui/label.jsx'
import { dateLabel } from '../lib/dates.js'
import EmojiPicker from './EmojiPicker.jsx'
import { File } from '@phosphor-icons/react'

// Creates the note or folder locally; it reaches GitHub on the next sync.
// A note asks for both its Title and its File name (`TitleNameFields`: the name follows the title until it's typed in);
// a folder or a view (`kind="view"`, one in the navigation) only its name; a view also offers its emoji beside it (none:
// the default icon). With `date` (lib/dates.js parts: a planner's New task), a note also asks for its day, starting on
// that one (the picker, `dayOnly`: a day, never emptied). `onCreate(name, title, date, emoji)`.
export default function NewFileModal({ folder, kind, date: startDate, onCreate, onClose }) {
  const isFolder = kind !== 'note' // one name: a folder's or a view's
  const noun = kind === 'view' ? 'View' : 'Folder'
  const fields = useTitleName()
  const [folderName, setFolderName] = useState('')
  const [error, setError] = useState('')
  const [date, setDate] = useState(startDate)
  const [emoji, setEmoji] = useState('')
  const name = isFolder ? folderName : fields.name
  const ready = name.trim() && (isFolder || fields.title.trim())

  function handleCreate(e) {
    e.preventDefault()
    setError(onCreate(name.trim(), fields.title.trim(), date, emoji) || '')
  }

  return (
    <BottomSheet
      title={`New ${kind}`}
      description={folder ? `in ${folder}` : undefined}
      onClose={onClose}
    >
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        {isFolder
          ? (
            <div className="flex gap-space-sm">
              {kind === 'view' && <EmojiPicker emoji={emoji} label="Emoji of the view" variant="outline" fallback={<File />} onChange={setEmoji} />}
              <Input type="text" placeholder={`${noun} name`} aria-label={`${noun} name`} value={folderName} onChange={e => { setFolderName(e.target.value); setError('') }} autoCorrect="off" autoCapitalize="words" className="min-w-0 flex-1" />
            </div>
          )
          : <TitleNameFields fields={fields} onEdit={() => setError('')} />}
        {!isFolder && date && (
          <div className="flex flex-col items-start gap-1.5">
            <Label>Date</Label>
            <DateField label={dateLabel(date)} date={date} onPick={setDate} dayOnly />
          </div>
        )}
        {error && <p className="text-destructive-ink text-xs">{error}</p>}
        <SheetActions>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!ready}>Create</Button>
        </SheetActions>
      </form>
    </BottomSheet>
  )
}
