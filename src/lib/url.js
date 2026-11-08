import { PAGE } from './pages.js'

// Address bar <-> open view. A view is { file, folder }: a file path, or a
// folder path ('' is the repo root). The URL is `base` + the path, with a
// trailing slash for folders.

const encode = p => p.split('/').map(encodeURIComponent).join('/')

export function urlForView(base, { file, folder }) {
  if (file) return base + encode(file)
  return folder ? base + encode(folder) + '/' : base
}

// The view a pathname names, or null if it can't be read
export function viewForUrl(base, pathname) {
  if (!pathname.startsWith(base)) return null
  let path
  try { path = pathname.slice(base.length).split('/').map(decodeURIComponent).join('/') } catch { return null }
  if (path === '' || path.endsWith('/')) return { file: null, folder: path.replace(/\/$/, '') }
  return { file: path, folder: path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '' }
}

// `view` limited to what exists: a missing file opens its folder, a missing
// folder its nearest existing parent. `files` are paths, `folders` the
// folder paths ('' always exists).
export function existingView({ file, folder }, files, folders) {
  if (file && files.has(file)) return { file, folder }
  const known = new Set(folders)
  while (folder && !known.has(folder)) folder = folder.includes('/') ? folder.slice(0, folder.lastIndexOf('/')) : ''
  return { file: null, folder }
}

// Address bar <-> a main page and its view (lib/views.js). File manager's is
// the plain view URL; every other page (a view such as Home, or Graph) adds `?page=<id>`, and a page's own
// content (view null) has no path. Their root folder adds `&root`.
export function urlForPage(base, page, view) {
  const url = view ? urlForView(base, view) : base
  if (page === PAGE.FILES) return url
  return `${url}?page=${page}${view && !view.file && !view.folder ? '&root' : ''}`
}

// { page, view } a location names, or null if it can't be read. The page may be
// one that no longer exists (a deleted view): App falls back from it.
export function pageForUrl(base, pathname, search) {
  const params = new URLSearchParams(search)
  const page = params.get('page') ?? PAGE.FILES
  if (page === PAGE.SETTINGS || page === PAGE.LINKS || page === PAGE.ASSETS || !/^[\w-]+$/.test(page)) return null
  const view = viewForUrl(base, pathname)
  if (!view) return null
  const own = page !== PAGE.FILES && !view.file && !view.folder && !params.has('root')
  return { page, view: own ? null : view }
}
