import { virtualFiles, editNote } from './changes.js'
import { withKeys, noteTitle } from './frontmatter.js'
import { fileName } from './files.js'
import { SYMLINK_MODE } from './links.js'

// Helpers for the notes of a folder that a widget (board, planner) works on

// A file as the app's file actions take it ({ name, path, type })
export const fileItem = path => ({ path, name: path.slice(path.lastIndexOf('/') + 1), type: 'file' })

// A card's title: its note's (`text`; undefined when it isn't on this device: the file's name). Kept as written: a card shows its note's icon before it (NoteCard's FileIcon)
export const cardTitle = (path, text) => text === undefined ? fileName(path) : noteTitle(text, fileName(path))

// Technical files and folders (".assets", "_attachments", ".gitkeep"…): a name starting with "." or "_"
// anywhere in the path keeps it off a widget
const technical = part => /^[._]/.test(part)
export const isTechnical = rest => rest.split('/').some(technical)

// `ch` with `edit(text)` applied to every note of a widget in `folder` (in `ch`'s files):
// technical files and symlinks (whose text is the path they point to) are left alone.
export function editNotes(ch, files, folder, edit, remoteText) {
  const prefix = folder ? folder + '/' : ''
  let next = ch
  for (const [path, entry] of Object.entries(virtualFiles(files, ch))) {
    if (!path.startsWith(prefix) || !path.endsWith('.md') || entry.mode === SYMLINK_MODE || isTechnical(path.slice(prefix.length))) continue
    next = editNote(next, files, path, edit, remoteText)
  }
  return next
}

// `ch` with every note in `folder` given the `keys` it lacks, empty (lib/frontmatter.js)
export const withNoteKeys = (ch, files, folder, keys, remoteText) => editNotes(ch, files, folder, t => withKeys(t, keys), remoteText)
