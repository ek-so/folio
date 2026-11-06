// A note widget: one markdown file shown in a box of fixed height on a view, where it can be
// read, edited (its Edit button) and opened full screen. Its settings live in the repo,
// beside the views: `.folio/notes/<id>.json`, { "file": "path/to/note.md" }.

export const notePath = id => `.folio/notes/${id}.json`

// The settings a file's text holds, or null when it can't be read as them
export function parseNote(text) {
  try {
    const data = JSON.parse(text)
    return typeof data?.file === 'string' && data.file ? { file: data.file } : null
  } catch {
    return null
  }
}

export const serializeNote = note => JSON.stringify(note, null, 2) + '\n'

// The settings after a file or folder moved from `from` to `to`: its file follows
export function movedNote(note, from, to, isDir) {
  if (note.file === from && !isDir) return { file: to }
  if (isDir && note.file.startsWith(from + '/')) return { file: to + note.file.slice(from.length) }
  return note
}

// The notes a widget can show from `folder` ('' is the root): its markdown files right in it, by name
export function folderNotes(files, folder) {
  const prefix = folder ? folder + '/' : ''
  return files
    .filter(p => p.startsWith(prefix) && !p.slice(prefix.length).includes('/') && p.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b))
}
