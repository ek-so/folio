const RECENT_KEY = 'folio_recent'
const TOKEN_KEY = 'brain_gh_token'
const REPO_KEY = 'brain_gh_repo'
const REPOS_KEY = 'folio_repos'
const USER_KEY = 'folio_user'
const THEME_KEY = 'folio_theme'
const TRAILS_KEY = 'folio_trails'
const PAGE_KEY = 'folio_page'
const EXPANDED_KEY = 'folio_expanded'
const TREE_WIDTH_KEY = 'folio_tree_width'
const RAIL_WIDTH_KEY = 'folio_rail_width'
const RAIL_KEY = 'folio_rail_collapsed'
const TREE_KEY = 'folio_tree_collapsed'
const FILES_VIEW_KEY = 'folio_files_view'
const CHANGES_KEY = 'folio_changes_'

function read(store, key) {
  try { return store.getItem(key) } catch { return null }
}

function write(store, key, value) {
  try {
    if (value === null || value === undefined) store.removeItem(key)
    else store.setItem(key, value)
  } catch {}
}

export const storage = {
  getToken: () => read(localStorage, TOKEN_KEY),
  setToken: (token) => write(localStorage, TOKEN_KEY, token),
  getRepo: () => read(localStorage, REPO_KEY),
  setRepo: (repo) => write(localStorage, REPO_KEY, repo),
  // Last signed-in GitHub user, so the app can start offline
  getUser: () => {
    try { return JSON.parse(read(localStorage, USER_KEY)) } catch { return null }
  },
  setUser: (user) => write(localStorage, USER_KEY, user && JSON.stringify({ login: user.login })),
  getTreeWidth: () => read(localStorage, TREE_WIDTH_KEY),
  setTreeWidth: (width) => write(localStorage, TREE_WIDTH_KEY, String(width)),
  getRailWidth: () => read(localStorage, RAIL_WIDTH_KEY),
  setRailWidth: (width) => write(localStorage, RAIL_WIDTH_KEY, String(width)),
  getRailCollapsed: () => read(localStorage, RAIL_KEY) === '1',
  setRailCollapsed: (collapsed) => write(localStorage, RAIL_KEY, collapsed ? '1' : null),
  getTreeCollapsed: () => read(localStorage, TREE_KEY) === '1',
  setTreeCollapsed: (collapsed) => write(localStorage, TREE_KEY, collapsed ? '1' : null),
  // File manager's layout: 'list' | 'cards'
  // Cards unless the list was chosen
  getFilesView: () => read(localStorage, FILES_VIEW_KEY) === 'list' ? 'list' : 'cards',
  setFilesView: (view) => write(localStorage, FILES_VIEW_KEY, view === 'list' ? 'list' : null),
  getTheme: () => read(localStorage, THEME_KEY),
  setTheme: (theme) => write(localStorage, THEME_KEY, theme),
  // Session-only, so a reload keeps the current folder, open note and page
  // What each main page has opened: { home, files, graph } -> trail of views (lib/views.js)
  getTrails: () => {
    try { return JSON.parse(read(sessionStorage, TRAILS_KEY)) || {} } catch { return {} }
  },
  setTrails: (trails) => write(sessionStorage, TRAILS_KEY, JSON.stringify(trails)),
  // Open page ('home' | 'files' | 'graph' | 'settings' | 'links'), null when unset
  getPage: () => read(sessionStorage, PAGE_KEY),
  setPage: (page) => write(sessionStorage, PAGE_KEY, page),
  // Folders open in the file tree
  getExpanded: () => {
    try { return JSON.parse(read(sessionStorage, EXPANDED_KEY)) || [] } catch { return [] }
  },
  setExpanded: (paths) => write(sessionStorage, EXPANDED_KEY, JSON.stringify(paths)),
  getRecentFiles: () => {
    try { return JSON.parse(read(sessionStorage, RECENT_KEY)) || [] } catch { return [] }
  },
  addRecentFile: (path) => {
    try {
      const prev = JSON.parse(read(sessionStorage, RECENT_KEY)) || []
      const next = [path, ...prev.filter(p => p !== path)].slice(0, 15)
      write(sessionStorage, RECENT_KEY, JSON.stringify(next))
    } catch {}
  },
  // Repos used on this device ('owner/repo'), latest first
  getRepos: () => {
    try { return JSON.parse(read(localStorage, REPOS_KEY)) || [] } catch { return [] }
  },
  addRepo: (repo) => {
    const next = [repo, ...storage.getRepos().filter(r => r !== repo)].slice(0, 8)
    write(localStorage, REPOS_KEY, JSON.stringify(next))
  },
  // What's open in this repo: the page stays, the trails, open folders and recent files go
  clearRepoSession: () => {
    for (const key of [TRAILS_KEY, EXPANDED_KEY, RECENT_KEY]) write(sessionStorage, key, null)
  },
  // Everything tied to the signed-in account; theme stays
  clearSession: () => {
    for (const key of [TOKEN_KEY, REPO_KEY, REPOS_KEY, USER_KEY]) write(localStorage, key, null)
    for (const key of [TRAILS_KEY, PAGE_KEY, EXPANDED_KEY, RECENT_KEY]) write(sessionStorage, key, null)
  },
}

export const localChanges = {
  get: (repo) => {
    try { return JSON.parse(read(localStorage, CHANGES_KEY + repo)) } catch { return null }
  },
  set: (repo, changes) => write(localStorage, CHANGES_KEY + repo, JSON.stringify(changes)),
  clear: (repo) => write(localStorage, CHANGES_KEY + repo, null),
}
