import { Note } from '@phosphor-icons/react'
import { later } from '@/lib/later.js'
import { noteSettings, noteWrite, movedNote, notePath, noteWidgetTitle } from './note.js'
import { displayName } from '@/lib/files.js'

// The Note widget: one note's markdown on a view (note.js). Its settings are .folio/single-note/<id>.json.
const readIn = (config, ch, id) => {
  const text = config.readIn(ch, notePath(id))
  return typeof text === 'string' ? noteSettings(() => ({ ready: true, text }), id) : null
}

export default {
  type: 'single-note',
  label: 'Note',
  icon: Note,
  Widget: later(() => import('./NoteWidget.jsx')),
  Setup: later(() => import('./NoteSetup.jsx')),
  title: (id, { config, notes }) => noteWidgetTitle(noteSettings(config.read, id), notes),
  named: false, // its Rename renames its note

  tree(id, { config }) {
    const settings = noteSettings(config.read, id)
    return settings ? [{ key: settings.path, name: displayName(settings.path), path: settings.path }] : []
  },
  // Its note follows renames and moves
  moved(ch, id, from, to, isDir, { config }) {
    const settings = readIn(config, ch, id)
    if (!settings) return ch
    const moved = movedNote(settings, from, to, isDir)
    return moved === settings ? ch : noteWrite(config, id, moved)(ch)
  },
  // The note itself stays
  removed: (ch, id, { config }) => config.erase(notePath(id))(ch),
}
