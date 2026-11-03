// The app's pages (`page` in App). The main ones are listed in the ☰ menu.
export const PAGE = { HOME: 'home', FILES: 'files', GRAPH: 'graph', SETTINGS: 'settings', LINKS: 'links' }

// Title of each main page: its header's title and its menu entry
export const MAIN_PAGES = [
  { id: PAGE.HOME, title: 'Home' },
  { id: PAGE.FILES, title: 'File manager' },
  { id: PAGE.GRAPH, title: 'Graph' },
]

export const pageTitle = id => MAIN_PAGES.find(p => p.id === id)?.title
