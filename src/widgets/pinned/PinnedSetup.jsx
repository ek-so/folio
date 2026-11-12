import { useMemo, useRef, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import FolderSheet from '@/components/FolderSheet.jsx'
import SearchSheet from '@/components/SearchSheet.jsx'
import NewFileModal from '@/components/NewFileModal.jsx'
import { ListRow } from '@/components/ui/list-row.jsx'
import { settingsWrite, isNote } from './pinned.js'

// Picks a note or a folder to pin: found by searching the repo's notes and folders (folders first), or New note…, which
// asks for its folder and name. `onPick(path, first)`: `first` (ch => ch) makes a new note, to apply in the same step.
// `title`: the search sheet's.
export function PinPicker({ services, onPick, onClose, title = 'Pin note or folder' }) {
  const { folders, files } = services
  const [step, setStep] = useState('search') // 'search', then for a new note 'folder' and 'name'
  const [folder, setFolder] = useState('') // the new note's folder ('' is the root)
  const picked = useRef(false) // the folder sheet closes after a pick: that's no cancel
  const all = useMemo(() => Object.fromEntries(files.map(f => [f, true])), [files])

  if (step === 'search') return (
    <SearchSheet
      title={title}
      placeholder="Search notes and folders…"
      virtual={all}
      only={isNote}
      folders={folders}
      onSelectFolder={path => onPick(path)}
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
      onCreate={(name, title) => {
        const made = services.addNote(folder, name, title)
        if (made.error) return made.error
        onPick(made.path, made.change)
        return null
      }}
      onClose={onClose}
    />
  )
}

// A new Pinned widget, starting with one picked note or folder
export default function PinnedSetup({ services, onCreate, onClose }) {
  return (
    <PinPicker
      services={services}
      onPick={(path, first = ch => ch) => onCreate(id => ch => settingsWrite(services.config, id, { items: [{ path }] })(first(ch)))}
      onClose={onClose}
    />
  )
}
