import { Note } from '@phosphor-icons/react'
import NoteWidget from './NoteWidget.jsx'
import NoteSetup from './NoteSetup.jsx'
import { notePath, parseNotes, serializeNotes, movedNotes } from './note.js'
import { displayName } from '@/lib/files.js'

// The notes widget: notes side by side, shown and edited on a view (note.js). Its settings are .folio/notes/<id>.json.
export default {
  type: 'note',
  label: 'Notes',
  icon: Note,
  Widget: NoteWidget,
  Setup: NoteSetup,
  title: () => 'Notes',
  // Its notes, in their order
  tree(id, { config }) {
    const file = config.read(notePath(id))
    const settings = file.ready && file.text !== undefined ? parseNotes(file.text) : null
    return (settings?.notes ?? []).map(n => ({ key: n.file, name: displayName(n.file), path: n.file }))
  },
  // Its notes follow renames and moves
  moved(ch, id, from, to, isDir, { config }) {
    const text = config.readIn(ch, notePath(id))
    const settings = typeof text === 'string' ? parseNotes(text) : null
    if (!settings) return ch
    const moved = movedNotes(settings, from, to, isDir)
    return moved === settings ? ch : config.write(notePath(id), serializeNotes(moved))(ch)
  },
  // The notes themselves stay
  removed: (ch, id, { config }) => config.erase(notePath(id))(ch),
}
