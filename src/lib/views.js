import { PAGE, MAIN_PAGES } from './pages.js'

// What each main page shows: a view { file, folder } (a file and the folder
// holding it, or a folder alone; '' is the root), or null for the page's own
// content (Home's dashboard, the graph). File manager always has a view.

const parentOf = path => path.slice(0, Math.max(path.lastIndexOf('/'), 0))

export const fileView = path => ({ file: path, folder: parentOf(path) })
export const folderView = path => ({ file: null, folder: path })

// Every main page's starting view
export const defaultViews = () => Object.fromEntries(MAIN_PAGES.map(p => [p.id, p.id === PAGE.FILES ? folderView('') : null]))

// Apply `fn` to every page's view (a page's own content stays)
export const mapViews = (views, fn) => Object.fromEntries(Object.entries(views).map(([id, view]) => [id, view && fn(view)]))

const inside = (path, p) => p !== null && (p === path || p.startsWith(path + '/'))

// `view` after the item at `from` moved to `to`: it follows the item
export function movedView(view, from, to) {
  const follow = p => inside(from, p) ? to + p.slice(from.length) : p
  return { file: follow(view.file), folder: follow(view.folder) }
}

// `view` after the item at `path` was deleted: the open file's folder, or the
// deleted folder's parent (the same view when it wasn't affected)
export function removedView(view, path) {
  if (inside(path, view.folder)) return folderView(parentOf(path))
  if (inside(path, view.file)) return folderView(view.folder)
  return view
}

// Every page's view after the item at `path` was deleted: File manager shows
// what's left (removedView); Home and Graph go back to their own content
export const removedViews = (views, path) => Object.fromEntries(Object.entries(views).map(([id, view]) => {
  const next = view && removedView(view, path)
  return [id, next !== view && id !== PAGE.FILES ? null : next]
}))
