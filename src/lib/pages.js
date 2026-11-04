import { House, FolderOpen, Graph, Gear, LinkBreak } from '@phosphor-icons/react'

// The app's pages (`page` in App). The main ones are in the navigation.
export const PAGE = { HOME: 'home', FILES: 'files', GRAPH: 'graph', SETTINGS: 'settings', LINKS: 'links' }

const PAGES = [
  { id: PAGE.HOME, title: 'Home', icon: House, main: true },
  { id: PAGE.FILES, title: 'File manager', icon: FolderOpen, main: true },
  { id: PAGE.GRAPH, title: 'Graph', icon: Graph, main: true },
  { id: PAGE.SETTINGS, title: 'Settings', icon: Gear },
  { id: PAGE.LINKS, title: 'Broken links', icon: LinkBreak },
]

// Title and icon of every page
export const pageInfo = id => PAGES.find(p => p.id === id)

// The main pages: Home, File manager, Graph
export const MAIN_PAGES = PAGES.filter(p => p.main)

// Apply `fn` to the open file of every main page ({ page: path | null })
export const mapOpenFiles = (openFiles, fn) => Object.fromEntries(Object.entries(openFiles).map(([id, path]) => [id, fn(path)]))
