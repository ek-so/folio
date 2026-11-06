// A note widget: one markdown file shown in a box of fixed height on a view, where it can be
// read, edited (its Edit button) and opened full screen. Its settings live in the repo,
// beside the views: `.folio/notes/<id>.json`, { "file": "path/to/note.md", "height": 480 } (`height`: its box's
// height on desktop, px, when it was resized; NOTE_HEIGHT's default otherwise).
import { NOTE_HEIGHT, clampSize } from '@/lib/resize.js'

export const notePath = id => `.folio/notes/${id}.json`

// The settings a file's text holds, or null when it can't be read as them
export function parseNote(text) {
  try {
    const data = JSON.parse(text)
    if (typeof data?.file !== 'string' || !data.file) return null
    return Number.isFinite(data.height) ? { file: data.file, height: clampSize(data.height, NOTE_HEIGHT) } : { file: data.file }
  } catch {
    return null
  }
}

// The height its box shows at on desktop
export const noteHeight = note => note.height ?? NOTE_HEIGHT.default

export const serializeNote = note => JSON.stringify(note, null, 2) + '\n'

// The settings after a file or folder moved from `from` to `to`: its file follows
export function movedNote(note, from, to, isDir) {
  if (note.file === from && !isDir) return { ...note, file: to }
  if (isDir && note.file.startsWith(from + '/')) return { ...note, file: to + note.file.slice(from.length) }
  return note
}

// The notes a widget can show from `folder` ('' is the root): its markdown files right in it, by name
export function folderNotes(files, folder) {
  const prefix = folder ? folder + '/' : ''
  return files
    .filter(p => p.startsWith(prefix) && !p.slice(prefix.length).includes('/') && p.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b))
}
