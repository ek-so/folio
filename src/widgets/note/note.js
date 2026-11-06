// The notes widget: markdown files shown side by side in boxes on a view (each resizable in height on desktop),
// where they can be read, edited (each one's Edit button) and opened full screen. Its settings live in the repo,
// beside the views: `.folio/notes/<id>.json`, { "notes": [{ "file": "path/to/note.md", "height": 480 }] } (`height`:
// a box's height on desktop, px, when it was resized; NOTE_HEIGHT's default otherwise). An older widget's
// { "file", "height" } (one note) reads as a list of that one.
import { NOTE_HEIGHT, clampSize } from '@/lib/resize.js'

export const notePath = id => `.folio/notes/${id}.json`

// One note's entry, or null when it isn't one
function parseEntry(data) {
  if (typeof data?.file !== 'string' || !data.file) return null
  return Number.isFinite(data.height) ? { file: data.file, height: clampSize(data.height, NOTE_HEIGHT) } : { file: data.file }
}

// The settings a file's text holds ({ notes: [entry] }), or null when it can't be read as them
export function parseNotes(text) {
  try {
    const data = JSON.parse(text)
    if (Array.isArray(data?.notes)) return { notes: data.notes.map(parseEntry).filter(Boolean) }
    const one = parseEntry(data)
    return one ? { notes: [one] } : null
  } catch {
    return null
  }
}

export const serializeNotes = settings => JSON.stringify(settings, null, 2) + '\n'

// The height a note's box shows at on desktop
export const noteHeight = entry => entry.height ?? NOTE_HEIGHT.default

// The settings with the note at `index` resized to `height`; the default isn't stored
export function resizedNote(settings, index, height) {
  const notes = settings.notes.map((n, i) => i !== index ? n : height === NOTE_HEIGHT.default ? { file: n.file } : { file: n.file, height })
  return { ...settings, notes }
}

// The settings with `file` added at the end (a note already shown isn't added again)
export const addedNote = (settings, file) =>
  settings.notes.some(n => n.file === file) ? settings : { ...settings, notes: [...settings.notes, { file }] }

// The settings without the note at `index` (its file stays)
export const removedNote = (settings, index) => ({ ...settings, notes: settings.notes.filter((_, i) => i !== index) })

// The settings with the note at `from` moved to `to`
export function reorderedNote(settings, from, to) {
  const notes = [...settings.notes]
  notes.splice(to, 0, ...notes.splice(from, 1))
  return { ...settings, notes }
}

// The settings after a file or folder moved from `from` to `to`: its notes follow (the same object when none did)
export function movedNotes(settings, from, to, isDir) {
  let changed = false
  const notes = settings.notes.map(n => {
    const file = !isDir && n.file === from ? to : isDir && n.file.startsWith(from + '/') ? to + n.file.slice(from.length) : n.file
    if (file === n.file) return n
    changed = true
    return { ...n, file }
  })
  return changed ? { ...settings, notes } : settings
}

// Whether a repo path is a note a widget can show: a markdown file, not one of the app's settings
export const isNote = path => path.toLowerCase().endsWith('.md') && !path.startsWith('.folio/')
