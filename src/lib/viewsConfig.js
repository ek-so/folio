// The views in the navigation (Home and the ones added with "Add view") live
// in the repo, like Obsidian's config folder: `.folio/views.json`,
// { "views": [{ "id", "name" }] }. A repo without the file has Home alone.
// The file is a normal local change, committed by Sync; it never shows in
// File manager, the file tree or Search (`isConfigPath`).

export const VIEWS_PATH = '.folio/views.json'
export const DEFAULT_VIEWS = [{ id: 'home', name: 'Home' }]
export const MAX_VIEW_NAME = 40

// Ids that belong to other pages
const RESERVED = ['files', 'graph', 'settings', 'links']

export const isConfigPath = path => path === '.folio' || path.startsWith('.folio/')

// The views a file's text holds: the default for no file (undefined), and for
// text that can't be read as views (never an error: the nav must always work)
export function parseViews(text) {
  if (text === undefined) return DEFAULT_VIEWS
  try {
    const list = JSON.parse(text)?.views
    if (!Array.isArray(list)) return DEFAULT_VIEWS
    const seen = new Set(RESERVED)
    const views = []
    for (const v of list) {
      if (typeof v?.id !== 'string' || typeof v?.name !== 'string' || !v.name.trim() || seen.has(v.id)) continue
      seen.add(v.id)
      views.push({ id: v.id, name: v.name })
    }
    return views
  } catch {
    return DEFAULT_VIEWS
  }
}

export const serializeViews = views => JSON.stringify({ views }, null, 2) + '\n'

// An error message for a view name, or '' when it's fine (a new view may have none: see addView)
export function viewNameError(name) {
  if (!name.trim()) return 'Enter a name.'
  if (name.trim().length > MAX_VIEW_NAME) return `Use at most ${MAX_VIEW_NAME} characters.`
  return ''
}

const newId = views => {
  const used = new Set([...views.map(v => v.id), ...RESERVED])
  let id
  do id = 'v' + Math.random().toString(36).slice(2, 8)
  while (used.has(id))
  return id
}

// `views` with one more at the end, and its id; no name is called Untitled
export function addView(views, name = '') {
  const id = newId(views)
  return { views: [...views, { id, name: name.trim() || 'Untitled' }], id }
}

export const renameView = (views, id, name) => views.map(v => v.id === id ? { ...v, name: name.trim() } : v)

export const removeView = (views, id) => views.filter(v => v.id !== id)
