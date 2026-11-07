import { useMemo, useRef, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import FolderSheet from '@/components/FolderSheet.jsx'
import SearchSheet from '@/components/SearchSheet.jsx'
import NewFileModal from '@/components/NewFileModal.jsx'
import { ListRow } from '@/components/ui/list-row.jsx'
import { notePath, serializeNotes, isNote } from './note.js'

// Picks a note: found by searching every note in the repo, or New note…, which asks for its folder and name.
// `onPick(path, first)`: `first` (ch => ch) makes a new note, to apply in the same step. `title`: the search sheet's.
export function NotePicker({ services, onPick, onClose, title = 'Add note' }) {
  const { folders, files } = services
  const [step, setStep] = useState('search') // 'search', then for a new note 'folder' and 'name'
  const [folder, setFolder] = useState('') // the new note's folder ('' is the root)
  const picked = useRef(false) // the folder sheet closes after a pick: that's no cancel
  const all = useMemo(() => Object.fromEntries(files.map(f => [f, true])), [files])

  if (step === 'search') return (
    <SearchSheet
      title={title}
      placeholder="Search notes…"
      virtual={all}
      only={isNote}
      top={<ListRow icon={<Plus />} title="New note…" onClick={() => setStep('folder')} />}
      onSelect={path => onPick(path)}
      onClose={() => { if (!picked.current) onClose() }}
    />
  )

  if (step === 'folder') return (
    <FolderSheet
      title="New note in…"
      folders={['', ...folders]}
      onPick={f => { picked.current = true; setFolder(f); setStep('name'); return null }}
      onClose={() => { if (!picked.current) onClose() }}
    >
      <p className="text-muted-foreground text-xs">Next, name the new note.</p>
    </FolderSheet>
  )

  return (
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
