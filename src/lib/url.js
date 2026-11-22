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

// Address bar <-> a page and its view (lib/views.js). File manager's is
// the plain view URL; every other page (a view such as Home, Graph, or Broken links and the other fixed pages) adds
// `?page=<id>`, and a page's own content (view null) has no path. Their root folder adds `root`. `at` ({ widget id:
// its place }, a view's own content: where each widget is, such as a planner's view and day) adds
// `at=<id>~<place>,…`, so moving inside a widget is a step Back and Forward go through. `repo` ('owner/name') adds
// `repo=owner/name` last, so any address opens the same thing in that repo (a share link)
export function urlForPage(base, page, view, repo, at = {}) {
  const url = view ? urlForView(base, view) : base
  const places = Object.keys(at).filter(id => at[id]).sort().map(id => `${id}~${at[id]}`).join(',')
  const query = [
    page !== PAGE.FILES && `page=${page}`,
    page !== PAGE.FILES && view && !view.file && !view.folder && 'root',
    places && `at=${places}`,
    repo && `repo=${repo}`,
  ].filter(Boolean)
  return query.length ? `${url}?${query.join('&')}` : url
}

const PLACE = /^([\w-]+)~([\w.-]+)$/

// The widgets' places an address names ({ id: place }, urlForPage's `at`)
export function placesOf(search) {
  const text = new URLSearchParams(search).get('at') ?? ''
  return Object.fromEntries(text.split(',').map(part => PLACE.exec(part)).filter(Boolean).map(([, id, place]) => [id, place]))
}

const REPO = /^[\w.-]+\/[\w.-]+$/

// The repo an address names ('owner/name'), or null
export function repoOf(search) {
  const repo = new URLSearchParams(search).get('repo')
  return repo && REPO.test(repo) ? repo : null
}

// A file's or folder's share link (Copy link): its address in File manager, at `origin`, in `repo`
export const shareUrl = (origin, base, repo, path, isDir) => origin + urlForPage(base, PAGE.FILES, isDir ? { file: null, folder: path } : { file: path, folder: '' }, repo)

// The file or folder (its path, and whether it's a folder) a share link of `repo` names, or null: `text` is one link
// and nothing else, at `origin` + `base`, in `repo` (a link to another repo stays a web address), on any page (an address
// copied while a note was open on a view names it too); a page's own content or the root names nothing
export function sharedItem(text, origin, base, repo) {
  let url
  try { url = new URL(text.trim()) } catch { return null }
  if (url.origin !== origin || repoOf(url.search) !== repo) return null
  const view = viewForUrl(base, url.pathname)
  if (!view || (!view.file && !view.folder)) return null
  return view.file ? { path: view.file, dir: false } : { path: view.folder, dir: true }
}

const FIXED = [PAGE.LINKS, PAGE.DOCS, PAGE.ASSETS, PAGE.NOTIFICATIONS]

// { page, view } a location names, or null if it can't be read. The page may be
// one that no longer exists (a deleted view): App falls back from it.
export function pageForUrl(base, pathname, search) {
  const params = new URLSearchParams(search)
  const page = params.get('page') ?? PAGE.FILES
  if (!/^[\w-]+$/.test(page)) return null
  if (FIXED.includes(page)) return { page, view: null } // Broken links, Documentation, Assets, Notifications: no view of their own
  const view = viewForUrl(base, pathname)
  if (!view) return null
  const own = page !== PAGE.FILES && !view.file && !view.folder && !params.has('root')
  return { page, view: own ? null : view }
}
