// The views in the navigation (Home and the ones added in Views settings) live
// in the repo, like Obsidian's config folder: `.folio/views.json`,
// { "views": [{ "id", "name", "icon" (an emoji, optional), "widgets": [{ "id", "type" }] }] }. A repo without the file has Home alone.
// A view's widgets show on it, in order (an old "note" widget, the Notes widget, reads as "pinned", its new name); each kind is in src/widgets/ and keeps its own settings
// (a board: .folio/boards/<id>.json). A kind this version doesn't know is kept as it is.
// The file is a normal local change, committed by Sync; it never shows in
// File manager, the folder tree or Search (`isConfigPath`).

import { leadingEmoji } from './icons.js'

export const VIEWS_PATH = '.folio/views.json'
export const DEFAULT_VIEWS = [{ id: 'home', name: 'Home' }]

// Ids that belong to other pages
const RESERVED = ['files', 'graph', 'settings', 'links', 'docs']

export const isConfigPath = path => path === '.folio' || path.startsWith('.folio/')

// The views a file's text holds: the default for no file (undefined), null for
// text that can't be read as views (shown as the default, but never saved over)
export function parseViews(text) {
  if (text === undefined) return DEFAULT_VIEWS
  try {
    const list = JSON.parse(text)?.views
    if (!Array.isArray(list)) return null
    const seen = new Set(RESERVED)
    const views = []
    for (const v of list) {
      if (typeof v?.id !== 'string' || typeof v?.name !== 'string' || seen.has(v.id)) continue
      seen.add(v.id)
      const widgets = Array.isArray(v.widgets)
        ? v.widgets.filter(w => typeof w?.id === 'string' && typeof w.type === 'string').map(w => ({ id: w.id, type: w.type === 'note' ? 'pinned' : w.type }))
        : []
      views.push({ id: v.id, name: v.name, ...(typeof v.icon === 'string' && { icon: v.icon }), ...(widgets.length && { widgets }) })
    }
    return views
  } catch {
    return null
  }
}

export const serializeViews = views => JSON.stringify({ views }, null, 2) + '\n'

const newId = (views, letter = 'v') => {
  const used = new Set([...views.flatMap(v => [v.id, ...(v.widgets ?? []).map(w => w.id)]), ...RESERVED])
  let id
  do id = letter + Math.random().toString(36).slice(2, 8)
  while (used.has(id))
  return id
}

// `views` with one more at the end, and its id; it can have no name (shown as a light Untitled). Names have no
// length limit: the interface cuts what doesn't fit.
export function addView(views, name = '') {
  const id = newId(views)
  return { views: [...views, { id, name: name.trim() }], id }
}

// Renaming keeps the emoji the old name started with as its icon, so it doesn't vanish with the name
export const renameView = (views, id, name) => views.map(v => v.id !== id ? v : {
  ...v, name: name.trim(), ...(v.icon === undefined && leadingEmoji(v.name) && { icon: leadingEmoji(v.name) }),
})

// `views` with `emoji` as the icon of view `id`; '' takes it out, or, when its name starts with an emoji, says "none"
export const setViewIcon = (views, id, emoji) => views.map(v => {
  if (v.id !== id) return v
  const rest = Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'icon'))
  return emoji || leadingEmoji(v.name) ? { ...rest, icon: emoji } : rest
})

export const removeView = (views, id) => views.filter(v => v.id !== id)

// `views` with the view at index `from` moved to index `to`
export function moveView(views, from, to) {
  const next = [...views]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

// `views` with a new widget of `type` at the end of view `viewId`, and its id
export function addWidget(views, viewId, type) {
  const id = newId(views, 'w')
  return { views: views.map(v => v.id === viewId ? { ...v, widgets: [...(v.widgets ?? []), { id, type }] } : v), id }
}

export const removeWidget = (views, viewId, widgetId) => views.map(v => {
  if (v.id !== viewId) return v
  const widgets = (v.widgets ?? []).filter(w => w.id !== widgetId)
  return widgets.length ? { ...v, widgets } : { id: v.id, name: v.name }
})

// `views` with view `viewId`'s widget at index `from` moved to index `to`
export function moveWidget(views, viewId, from, to) {
  return views.map(v => {
    if (v.id !== viewId || !v.widgets) return v
    const widgets = [...v.widgets]
    widgets.splice(to, 0, ...widgets.splice(from, 1))
    return { ...v, widgets }
  })
}
