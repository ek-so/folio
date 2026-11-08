import { File, FolderOpen, Graph, Gear, LinkBreak, BookOpen } from '@phosphor-icons/react'

// The app's pages (`page` in App). Home and the views added in Views settings
// (lib/viewsConfig.js, kept in the repo) are pages too, each with its own id;
// `HOME` is the first view's id in a repo without a config. File manager and
// Graph, Settings, Broken links and Documentation are fixed.
export const PAGE = { HOME: 'home', FILES: 'files', GRAPH: 'graph', SETTINGS: 'settings', LINKS: 'links', DOCS: 'docs' }

const FIXED = [
  { id: PAGE.FILES, title: 'File manager', icon: FolderOpen },
  { id: PAGE.GRAPH, title: 'Graph', icon: Graph },
  { id: PAGE.SETTINGS, title: 'Settings', icon: Gear },
  { id: PAGE.LINKS, title: 'Broken links', icon: LinkBreak },
  { id: PAGE.DOCS, title: 'Documentation', icon: BookOpen },
]

// Title and icon of a page; `views` are the configured views (an unknown id has no title). A view with no name
// is titled Untitled (`untitled`: shown light, a `Placeholder`)
export function pageInfo(id, views = []) {
  const fixed = FIXED.find(p => p.id === id)
  if (fixed) return fixed
  const view = views.find(v => v.id === id)
  const name = view?.name.trim()
  return { id, title: view ? name || 'Untitled' : '', untitled: !!view && !name, icon: File, view: true }
}

// The main pages, in the navigation's order: the views, File manager, Graph
export const mainPages = views => [...views.map(v => pageInfo(v.id, views)), pageInfo(PAGE.FILES), pageInfo(PAGE.GRAPH)]
