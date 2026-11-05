import { File, FolderOpen, Graph, Gear, LinkBreak } from '@phosphor-icons/react'

// The app's pages (`page` in App). Home and the views added with "Add view"
// (lib/viewsConfig.js, kept in the repo) are pages too, each with its own id;
// `HOME` is the first view's id in a repo without a config. File manager and
// Graph, Settings and Broken links are fixed.
export const PAGE = { HOME: 'home', FILES: 'files', GRAPH: 'graph', SETTINGS: 'settings', LINKS: 'links' }

const FIXED = [
  { id: PAGE.FILES, title: 'File manager', icon: FolderOpen },
  { id: PAGE.GRAPH, title: 'Graph', icon: Graph },
  { id: PAGE.SETTINGS, title: 'Settings', icon: Gear },
  { id: PAGE.LINKS, title: 'Broken links', icon: LinkBreak },
]

// Title and icon of a page; `views` are the configured views (an unknown id has no title)
export const pageInfo = (id, views = []) =>
  FIXED.find(p => p.id === id) ?? { id, title: views.find(v => v.id === id)?.name ?? '', icon: File, view: true }

// The main pages, in the navigation's order: the views, File manager, Graph
export const mainPages = views => [...views.map(v => pageInfo(v.id, views)), pageInfo(PAGE.FILES), pageInfo(PAGE.GRAPH)]
