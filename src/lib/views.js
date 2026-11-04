import { PAGE, MAIN_PAGES } from './pages.js'

// What each main page shows. A view is { file, folder }: a file and the
// folder holding it, or a folder alone ('' is the root). Each page keeps a
// trail of the views opened in it, oldest first; the last one is what it
// shows and ← goes back to the one before. An empty trail is the page's
// start: Home's dashboard, the graph, File manager's root folder.

const MAX_TRAIL = 50
const parentOf = path => path.slice(0, Math.max(path.lastIndexOf('/'), 0))

export const fileView = path => ({ file: path, folder: parentOf(path) })
export const folderView = path => ({ file: null, folder: path })

const same = (a, b) => a.file === b.file && a.folder === b.folder
const isStart = (page, view) => !view || (page === PAGE.FILES && !view.file && !view.folder)

// Every main page at its start
export const startTrails = () => Object.fromEntries(MAIN_PAGES.map(p => [p.id, []]))

// What a page with `trail` shows: its last view, or its start (null for
// Home's and Graph's own content)
export const currentView = (page, trail) => trail.at(-1) ?? (page === PAGE.FILES ? folderView('') : null)

// `trail` after opening `view`: added at the end; the page's start clears it
export function openView(page, trail, view) {
  if (isStart(page, view)) return []
  const last = trail.at(-1)
  return last && same(last, view) ? trail : [...trail, view].slice(-MAX_TRAIL)
}

// `trail` after Back / Forward named `view`: back to it if it's on the
// trail, else opened
export function trailTo(page, trail, view) {
  if (isStart(page, view)) return []
  const i = trail.findLastIndex(v => same(v, view))
  return i >= 0 ? trail.slice(0, i + 1) : openView(page, trail, view)
}

const tidy = trail => trail.filter((v, i) => i === 0 || !same(v, trail[i - 1]))
const inside = (path, p) => p !== null && (p === path || p.startsWith(path + '/'))

// Every trail after the item at `from` moved to `to`: its views follow it
export const movedTrails = (trails, from, to) => {
  const follow = p => inside(from, p) ? to + p.slice(from.length) : p
  return Object.fromEntries(Object.entries(trails).map(([id, trail]) => [id, tidy(trail.map(v => ({ file: follow(v.file), folder: follow(v.folder) })))]))
}

// Every trail without the views `keep` turns down (deleted or gone items):
// each page goes back to what it showed before them
export const keptTrails = (trails, keep) =>
  Object.fromEntries(Object.entries(trails).map(([id, trail]) => [id, tidy(trail.filter(keep))]))
