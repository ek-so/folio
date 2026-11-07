// The notes widget: markdown files shown side by side in boxes of one height on a view (resizable on desktop),
// where they can be read, edited (each one's Edit button) and opened full screen. Its settings live in the repo,
// beside the views: `.folio/notes/<id>.json`, { "notes": [{ "file": "path/to/note.md" }], "height": 480 } (`height`:
// the boxes' height on desktop, px, when they were resized; NOTE_HEIGHT's default otherwise). An older widget's
// { "file", "height" } (one note) reads as a list of that one, and a height kept per note as the first one's.
import { NOTE_HEIGHT, clampSize } from '@/lib/resize.js'

export const notePath = id => `.folio/notes/${id}.json`

// One note's entry, or null when it isn't one
const parseEntry = data => typeof data?.file === 'string' && data.file ? { file: data.file } : null

// The settings a file's text holds ({ notes: [{ file }], height? }), or null when it can't be read as them
export function parseNotes(text) {
  let data
  try { data = JSON.parse(text) } catch { return null }
  const list = Array.isArray(data?.notes) ? data.notes : parseEntry(data) ? [data] : null
  if (!list) return null
  const height = [data.height, ...list.map(n => n?.height)].find(Number.isFinite)
  const notes = list.map(parseEntry).filter(Boolean)
  return height === undefined ? { notes } : { notes, height: clampSize(height, NOTE_HEIGHT) }
}

export const serializeNotes = settings => JSON.stringify(settings, null, 2) + '\n'

// The height the boxes show at on desktop
export const notesHeight = settings => settings.height ?? NOTE_HEIGHT.default

// The settings with the boxes resized to `height`; the default isn't stored
export function resizedNotes(settings, height) {
  const { notes } = settings
  return height === NOTE_HEIGHT.default ? { notes } : { notes, height }
}

// The settings with `file` added at the end (a note already shown isn't added again)
export const addedNote = (settings, file) =>
  settings.notes.some(n => n.file === file) ? settings : { ...settings, notes: [...settings.notes, { file }] }

// The settings without the note at `index` (its file stays)
// The note `from` (gone) replaced, in its place, by `to`; when `to` is already in the widget, `from` just goes
export const replacedNote = (settings, from, to) => settings.notes.some(n => n.file === to)
  ? { ...settings, notes: settings.notes.filter(n => n.file !== from) }
  : { ...settings, notes: settings.notes.map(n => n.file === from ? { ...n, file: to } : n) }

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
