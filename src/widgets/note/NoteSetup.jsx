import { useRef, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import FolderSheet from '@/components/FolderSheet.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import NewFileModal from '@/components/NewFileModal.jsx'
import FileIcon from '@/components/FileIcon.jsx'
import { ListRow } from '@/components/ui/list-row.jsx'
import { displayName } from '@/lib/files.js'
import { notePath, serializeNotes, folderNotes } from './note.js'

// Picks a note: its folder, then one of the notes right in it or a new one made there.
// `onPick(path, first)`: `first` (ch => ch) makes a new note, to apply in the same step.
export function NotePicker({ services, onPick, onClose }) {
  const { folders, files } = services
  const [folder, setFolder] = useState(null) // the picked folder ('' is the root), then the note's step
  const [naming, setNaming] = useState(false) // the new note's name is asked
  const picked = useRef(false) // the folder sheet closes after a pick: that's no cancel

  if (folder === null) return (
    <FolderSheet
      title="Note from folder…"
      folders={['', ...folders]}
      onPick={f => { picked.current = true; setFolder(f); return null }}
      onClose={() => { if (!picked.current) onClose() }}
    >
      <p className="text-muted-foreground text-xs">Next, pick one of its notes or make a new one.</p>
    </FolderSheet>
  )

  if (naming) return (
    <NewFileModal
      folder={folder}
      kind="note"
      onCreate={name => {
        const made = services.addNote(folder, name)
        if (made.error) return made.error
        onPick(made.path, made.change)
        return null
      }}
      onClose={onClose}
    />
  )

  const notes = folderNotes(files, folder)
  return (
    <BottomSheet title="Pick a note" description={folder ? `in ${folder}` : 'in (root)'} onClose={onClose}>
      <ul className="-mx-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto">
        <li><ListRow icon={<Plus />} title="New note…" onClick={() => setNaming(true)} /></li>
        {notes.map(path => (
          <li key={path}><ListRow icon={<FileIcon path={path} />} title={displayName(path)} onClick={() => onPick(path)} /></li>
        ))}
        {notes.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No notes right in this folder</p>}
      </ul>
    </BottomSheet>
  )
}

// A new notes widget, starting with one picked note
export default function NoteSetup({ services, onCreate, onClose }) {
  return (
    <NotePicker
      services={services}
      onPick={(path, first = ch => ch) => onCreate(id => ch => services.config.write(notePath(id), serializeNotes({ notes: [{ file: path }] }))(first(ch)))}
      onClose={onClose}
    />
  )
}
