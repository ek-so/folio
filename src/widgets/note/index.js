import { Note } from '@phosphor-icons/react'
import NoteWidget from './NoteWidget.jsx'
import NoteSetup from './NoteSetup.jsx'
import { noteTitle } from '@/lib/frontmatter.js'
import { displayName } from '@/lib/files.js'
import { notePath, parseNote, serializeNote, movedNote } from './note.js'

// The note widget: one note shown and edited on a view (note.js). Its settings are .folio/notes/<id>.json.
export default {
  type: 'note',
  label: 'Note',
  icon: Note,
  Widget: NoteWidget,
  Setup: NoteSetup,
  title(id, { config, notes }) {
    const file = config.read(notePath(id))
    const note = file.ready && file.text !== undefined ? parseNote(file.text) : null
    return note ? noteTitle(notes[note.file] ?? '', displayName(note.file)) : 'Note'
  },
  // Its note follows renames and moves
  moved(ch, id, from, to, isDir, { config }) {
    const text = config.readIn(ch, notePath(id))
    const note = typeof text === 'string' ? parseNote(text) : null
    if (!note) return ch
    const moved = movedNote(note, from, to, isDir)
    return moved === note ? ch : config.write(notePath(id), serializeNote(moved))(ch)
  },
  // The note itself stays
  removed: (ch, id, { config }) => config.erase(notePath(id))(ch),
}
