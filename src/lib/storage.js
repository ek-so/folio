const RECENT_KEY = 'folio_recent_'
const TOKEN_KEY = 'brain_gh_token'
const REPO_KEY = 'brain_gh_repo'
const REPOS_KEY = 'folio_repos'
const USER_KEY = 'folio_user'
const THEME_KEY = 'folio_theme'
const TRAILS_KEY = 'folio_trails'
const PAGE_KEY = 'folio_page'
const EXPANDED_KEY = 'folio_expanded'
const RAIL_WIDTH_KEY = 'folio_rail_width'
const RAIL_KEY = 'folio_rail_collapsed'
const FILES_VIEW_KEY = 'folio_files_view'
const CHANGES_KEY = 'folio_changes_'
const PLANNER_VIEW_KEY = 'folio_planner_view_'
const PLANNER_DAYS_KEY = 'folio_planner_days'

function read(store, key) {
  try { return store.getItem(key) } catch { return null }
}

// false when it couldn't be stored (storage full or blocked)
function write(store, key, value) {
  try {
    if (value === null || value === undefined) store.removeItem(key)
    else store.setItem(key, value)
    return true
  } catch {
    return false
  }
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
  getRailWidth: () => read(localStorage, RAIL_WIDTH_KEY),
  setRailWidth: (width) => write(localStorage, RAIL_WIDTH_KEY, String(width)),
  getRailCollapsed: () => read(localStorage, RAIL_KEY) === '1',
  setRailCollapsed: (collapsed) => write(localStorage, RAIL_KEY, collapsed ? '1' : null),
  // File manager's layout: 'list' | 'cards' | 'columns' (desktop only)
  // Cards unless another was chosen
  getFilesView: () => ['list', 'columns'].includes(read(localStorage, FILES_VIEW_KEY)) ? read(localStorage, FILES_VIEW_KEY) : 'cards',
  setFilesView: (view) => write(localStorage, FILES_VIEW_KEY, ['list', 'columns'].includes(view) ? view : null),
  // A planner's view (`id`: its widget's) picked on this device: 'calendar' | 'list', null when none was
  getPlannerView: (id) => read(localStorage, PLANNER_VIEW_KEY + id),
  setPlannerView: (id, view) => write(localStorage, PLANNER_VIEW_KEY + id, view),
  getTheme: () => read(localStorage, THEME_KEY),
  setTheme: (theme) => write(localStorage, THEME_KEY, theme),
  // Session-only, so a reload keeps the current folder, open note and page
  // What each main page has opened: { home, files, graph } -> trail of views (lib/views.js)
  getTrails: () => {
    try { return JSON.parse(read(sessionStorage, TRAILS_KEY)) || {} } catch { return {} }
  },
  setTrails: (trails) => write(sessionStorage, TRAILS_KEY, JSON.stringify(trails)),
  // Open page ('home' | 'files' | 'graph' | 'settings' | 'links' | 'docs'), null when unset
  getPage: () => read(sessionStorage, PAGE_KEY),
  setPage: (page) => write(sessionStorage, PAGE_KEY, page),
  // Folders open in the title bar's folder tree
  getExpanded: () => {
    try { return JSON.parse(read(sessionStorage, EXPANDED_KEY)) || [] } catch { return [] }
  },
  setExpanded: (paths) => write(sessionStorage, EXPANDED_KEY, JSON.stringify(paths)),
  // The day picked on a planner's ribbon (`id`: its widget's), so it's still selected after a note is opened and closed; null: today
  getPlannerDay: (id) => {
    try { return JSON.parse(read(sessionStorage, PLANNER_DAYS_KEY))?.[id] ?? null } catch { return null }
  },
  setPlannerDay: (id, key) => {
    let days = {}
    try { days = JSON.parse(read(sessionStorage, PLANNER_DAYS_KEY)) || {} } catch {}
    if (key) days[id] = key
    else delete days[id]
    write(sessionStorage, PLANNER_DAYS_KEY, JSON.stringify(days))
  },
  // Files recently opened in the open repo, latest first; kept on this device per repo, so Search lists them in a new session too
  getRecentFiles: () => {
    try { return JSON.parse(read(localStorage, RECENT_KEY + storage.getRepo())) || [] } catch { return [] }
  },
  addRecentFile: (path) => {
    const next = [path, ...storage.getRecentFiles().filter(p => p !== path)].slice(0, 15)
    write(localStorage, RECENT_KEY + storage.getRepo(), JSON.stringify(next))
  },
  // Repos used on this device ('owner/repo'), latest first
  getRepos: () => {
    try { return JSON.parse(read(localStorage, REPOS_KEY)) || [] } catch { return [] }
  },
  addRepo: (repo) => {
    const next = [repo, ...storage.getRepos().filter(r => r !== repo)].slice(0, 8)
    write(localStorage, REPOS_KEY, JSON.stringify(next))
  },
  // What's open in this repo: the page stays, the trails, open folders and planners' picked days go (recent files are per repo)
  clearRepoSession: () => {
    for (const key of [TRAILS_KEY, EXPANDED_KEY, PLANNER_DAYS_KEY]) write(sessionStorage, key, null)
  },
  // Everything tied to the signed-in account; theme stays
  clearSession: () => {
    let recents = []
    try { recents = Object.keys(localStorage).filter(key => key.startsWith(RECENT_KEY)) } catch {}
    for (const key of recents) write(localStorage, key, null)
    for (const key of [TOKEN_KEY, REPO_KEY, REPOS_KEY, USER_KEY]) write(localStorage, key, null)
    for (const key of [TRAILS_KEY, PAGE_KEY, EXPANDED_KEY, PLANNER_DAYS_KEY]) write(sessionStorage, key, null)
  },
}

export const localChanges = {
  get: (repo) => {
    try { return JSON.parse(read(localStorage, CHANGES_KEY + repo)) } catch { return null }
  },
  // false when they couldn't be stored
  set: (repo, changes) => write(localStorage, CHANGES_KEY + repo, JSON.stringify(changes)),
  clear: (repo) => write(localStorage, CHANGES_KEY + repo, null),
  // Calls `fn(changes)` (null when cleared) when another tab stores this repo's local changes; returns the unsubscribe
  watch: (repo, fn) => {
    const onStorage = e => {
      if (e.storageArea !== localStorage || e.key !== CHANGES_KEY + repo) return
      try { fn(JSON.parse(e.newValue)) } catch { fn(null) }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  },
}
