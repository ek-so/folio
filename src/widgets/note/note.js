// The Note widget: one note shown on a view, its markdown as a preview in a card of limited height. Its settings live in
// the repo, beside the views: `.folio/single-note/<id>.json`, { "path": "path/to/note.md", "height": 448 } (`height`, the
// card's height in px, only once it's changed: NOTE_HEIGHT, lib/resize.js). Its type is "single-note":
// "note" is an older Pinned widget's (parseViews).
export const notePath = id => `.folio/single-note/${id}.json`

// The settings a file's text holds ({ path, height }: the default height when it has none), or null when it can't be
// read as them
export function parseNote(text) {
  let data
  try { data = JSON.parse(text) } catch { return null }
  if (typeof data?.path !== 'string' || !data.path) return null
  return { path: data.path, height: clampSize(data.height, NOTE_HEIGHT) }
}

// The default height isn't written
export const serializeNote = ({ path, height = NOTE_HEIGHT.default }) =>
  JSON.stringify({ path, ...(height !== NOTE_HEIGHT.default && { height }) }, null, 2) + '\n'

import { fileName } from '../../lib/files.js'
import { clampSize, NOTE_HEIGHT } from '../../lib/resize.js'
import { noteTitle } from '../../lib/frontmatter.js'

// Its title: its note's (the file name when it has none, or isn't read yet); "Note" while its settings can't be read.
// `notes`: the repo's note texts by path
export const noteWidgetTitle = (settings, notes) => !settings ? 'Note'
  : notes[settings.path] === undefined ? fileName(settings.path) : noteTitle(notes[settings.path], fileName(settings.path))

// Its settings as `read(path)` gives them (hooks/useConfig.js), or null while they can't be read
export function noteSettings(read, id) {
  const file = read(notePath(id))
  return file.ready && file.text !== undefined ? parseNote(file.text) : null
}

// The change that saves `settings` (`config`: hooks/useConfig.js)
export const noteWrite = (config, id, settings) => config.write(notePath(id), serializeNote(settings))

// The settings after a file or folder moved from `from` to `to`: its note follows (the same object when it didn't move)
export function movedNote(settings, from, to, isDir) {
  const { path } = settings
  const next = path === from ? to : isDir && path.startsWith(from + '/') ? to + path.slice(from.length) : path
  return next === path ? settings : { ...settings, path: next }
}
