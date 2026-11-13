// The Pinned widget: notes and folders pinned to a view as cards, in the order they're dragged into. Its settings live in
// the repo, beside the views: `.folio/pinned/<id>.json`, { "items": [{ "path": "path/to/note.md" or "path/to/folder" }] }.
// It was the Notes widget, type "note" with `.folio/notes/<id>.json`, { "notes": [{ "file" }], "height" } (or an older
// { "file", "height" }): that still reads (parseViews reads the type as "pinned", `settingsOf` the file), and its next
// save writes the new file and removes the old one (`settingsWrite`). A height is no longer kept.
export const pinnedPath = id => `.folio/pinned/${id}.json`
export const oldPinnedPath = id => `.folio/notes/${id}.json`

// One item's entry ({ path }, or an old note's { file }), or null when it isn't one
const parseEntry = data => {
  const path = typeof data?.path === 'string' ? data.path : typeof data?.file === 'string' ? data.file : ''
  return path ? { path } : null
}

// The settings a file's text holds ({ items: [{ path }] }), or null when it can't be read as them
export function parsePinned(text) {
  let data
  try { data = JSON.parse(text) } catch { return null }
  const list = Array.isArray(data?.items) ? data.items : Array.isArray(data?.notes) ? data.notes : parseEntry(data) ? [data] : null
  if (!list) return null
  return { items: list.map(parseEntry).filter(Boolean) }
}

export const serializePinned = settings => JSON.stringify({ items: settings.items }, null, 2) + '\n'

// Its settings file as `read(path)` gives it ({ ready, text }): the new one, else (when there's none) the old one's
export function settingsOf(read, id) {
  const file = read(pinnedPath(id))
  return file.ready && file.text === undefined ? read(oldPinnedPath(id)) : file
}

// The change that saves `settings` (`config`: hooks/useConfig.js): the new file written, the old one gone
export const settingsWrite = (config, id, settings) => ch => config.erase(oldPinnedPath(id))(config.write(pinnedPath(id), serializePinned(settings))(ch))

// The settings with `path` added at the end (one already pinned isn't added again)
export const addedItem = (settings, path) =>
  settings.items.some(n => n.path === path) ? settings : { items: [...settings.items, { path }] }

// The settings without the item at `index` (its file or folder stays)
export const removedItem = (settings, index) => ({ items: settings.items.filter((_, i) => i !== index) })

// The item `from` (gone) replaced, in its place, by `to`; when `to` is already pinned, `from` just goes
export const replacedItem = (settings, from, to) => settings.items.some(n => n.path === to)
  ? { items: settings.items.filter(n => n.path !== from) }
  : { items: settings.items.map(n => n.path === from ? { path: to } : n) }

// The settings with the item at `from` moved to `to`
export function reorderedItem(settings, from, to) {
  const items = [...settings.items]
  items.splice(to, 0, ...items.splice(from, 1))
  return { items }
}

// The settings after a file or folder moved from `from` to `to`: its items follow (the same object when none did)
export function movedPinned(settings, from, to, isDir) {
  let changed = false
  const items = settings.items.map(n => {
    const path = n.path === from ? to : isDir && n.path.startsWith(from + '/') ? to + n.path.slice(from.length) : n.path
    if (path === n.path) return n
    changed = true
    return { path }
  })
  return changed ? { items } : settings
}

// Whether a repo path is a note that can be pinned: a markdown file, not one of the app's settings
export const isNote = path => path.toLowerCase().endsWith('.md') && !path.startsWith('.folio/')
