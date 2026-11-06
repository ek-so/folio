import { useRef, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import FolderSheet from '@/components/FolderSheet.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import NewFileModal from '@/components/NewFileModal.jsx'
import FileIcon from '@/components/FileIcon.jsx'
import { ListRow } from '@/components/ui/list-row.jsx'
import { displayName } from '@/lib/files.js'
import { notePath, serializeNote, folderNotes } from './note.js'

// A new note widget: pick its folder, then one of its notes or a new one made there
export default function NoteSetup({ services, onCreate, onClose }) {
  const { config, folders, files } = services
  const [folder, setFolder] = useState(null) // the picked folder ('' is the root), then the note's step
  const [naming, setNaming] = useState(false) // the new note's name is asked
  const picked = useRef(false) // the folder sheet closes after a pick: that's no cancel
  const create = (path, first = ch => ch) => onCreate(id => ch => config.write(notePath(id), serializeNote({ file: path }))(first(ch)))

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
        create(made.path, made.change)
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
          <li key={path}><ListRow icon={<FileIcon path={path} />} title={displayName(path)} onClick={() => create(path)} /></li>
        ))}
        {notes.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No notes right in this folder</p>}
      </ul>
    </BottomSheet>
  )
}
