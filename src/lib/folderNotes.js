import { virtualFiles, editNote } from './changes.js'
import { withKeys } from './frontmatter.js'
import { SYMLINK_MODE } from './links.js'

// Helpers for the notes of a folder that a widget (board, planner) works on

// A file as the app's file actions take it ({ name, path, type })
export const fileItem = path => ({ path, name: path.slice(path.lastIndexOf('/') + 1), type: 'file' })

// Technical files and folders (".assets", "_attachments", ".gitkeep"…): a name starting with "." or "_"
// anywhere in the path keeps it off a widget
const technical = part => /^[._]/.test(part)
export const isTechnical = rest => rest.split('/').some(technical)

// Whether `path` is one of a widget's notes in `folder`: not technical; with `flat` (a board),
// only right in the folder, not in its subfolders
export function inFolder(path, folder, flat = false) {
  const prefix = folder ? folder + '/' : ''
  if (!path.startsWith(prefix)) return false
  const rest = path.slice(prefix.length)
  return !!rest && !isTechnical(rest) && !(flat && rest.includes('/'))
}

// `ch` with `edit(text)` applied to every note of a widget in `folder` (in `ch`'s files; `flat`: see inFolder):
// technical files and symlinks (whose text is the path they point to) are left alone.
export function editNotes(ch, files, folder, edit, remoteText, flat = false) {
  let next = ch
  for (const [path, entry] of Object.entries(virtualFiles(files, ch))) {
    if (!inFolder(path, folder, flat) || !path.endsWith('.md') || entry.mode === SYMLINK_MODE) continue
    next = editNote(next, files, path, edit, remoteText)
  }
  return next
}

// `ch` with every note in `folder` given the `keys` it lacks, empty (lib/frontmatter.js)
export const withNoteKeys = (ch, files, folder, keys, remoteText, flat = false) => editNotes(ch, files, folder, t => withKeys(t, keys), remoteText, flat)
