const RECENT_KEY = 'folio_recent_'
const PUSHED_KEY = 'folio_pushed_'
const PUSHED_MAX = 500
const TOKEN_KEY = 'folio_token'
const REPO_KEY = 'folio_repo'
// The names they were kept under before, moved to the new ones on first read so no one is signed out
const OLD_KEYS = { [TOKEN_KEY]: 'brain_gh_token', [REPO_KEY]: 'brain_gh_repo' }
const REPOS_KEY = 'folio_repos'
const USER_KEY = 'folio_user'
const THEME_KEY = 'folio_theme'
const TRAILS_KEY = 'folio_trails' // this tab's (sessionStorage); with `_<repo>`, where each repo was last left (localStorage)
const PAGE_KEY = 'folio_page'
const RAIL_WIDTH_KEY = 'folio_rail_width'
const RAIL_KEY = 'folio_rail_collapsed'
const FILES_VIEW_KEY = 'folio_files_view'
const CHANGES_KEY = 'folio_changes_'
const PLANNER_VIEW_KEY = 'folio_planner_view_'
const PLANNER_DAYS_KEY = 'folio_planner_days'
const REMINDERS_KEY = 'folio_reminders_' // hooks/useReminderAlerts.js: those told, dismissed and seen on this device

function read(store, key) {
  try { return store.getItem(key) } catch { return null }
}

// `key`'s value, taking it from its old name (OLD_KEYS) the first time
function readMoved(key) {
  const value = read(localStorage, key)
  if (value !== null) return value
  const old = read(localStorage, OLD_KEYS[key])
  if (old !== null && write(localStorage, key, old)) write(localStorage, OLD_KEYS[key], null)
  return old
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
  getToken: () => readMoved(TOKEN_KEY),
  setToken: (token) => write(localStorage, TOKEN_KEY, token),
  getRepo: () => readMoved(REPO_KEY),
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
  // Where `repo` was left: each tab keeps its own (sessionStorage, so a reload stays where that tab was), and the
  // device keeps the last one per repo (localStorage), for a new tab or app start. Read: the tab's, else the device's.
  // Nothing is kept without a repo (signed out)
  // What each main page has opened: { home, files, graph } -> trail of views (lib/views.js)
  getTrails: (repo) => {
    if (!repo) return {}
    try { return JSON.parse(read(sessionStorage, TRAILS_KEY) ?? read(localStorage, `${TRAILS_KEY}_${repo}`)) || {} } catch { return {} }
  },
  setTrails: (repo, trails) => {
    if (!repo) return
    write(sessionStorage, TRAILS_KEY, JSON.stringify(trails))
    write(localStorage, `${TRAILS_KEY}_${repo}`, JSON.stringify(trails))
  },
  // Open page (a view's id, 'files', 'graph', 'links', 'docs'…), null when unset
  getPage: (repo) => repo ? read(sessionStorage, PAGE_KEY) ?? read(localStorage, `${PAGE_KEY}_${repo}`) : null,
  setPage: (repo, page) => {
    if (!repo) return
    write(sessionStorage, PAGE_KEY, page)
    write(localStorage, `${PAGE_KEY}_${repo}`, page)
  },
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
  // What's open in this tab, on switching repos: its page, trails, open folders and planners' picked days go (where each
  // repo was left, and recent files, are kept per repo on the device)
  clearRepoSession: () => {
    for (const key of [TRAILS_KEY, PAGE_KEY, PLANNER_DAYS_KEY]) write(sessionStorage, key, null)
  },
  // The commits this device pushed to `repo` (their shas, latest first, the last PUSHED_MAX): Recent updates marks them ↑
  getPushed: (repo) => {
    try { return JSON.parse(read(localStorage, PUSHED_KEY + repo)) || [] } catch { return [] }
  },
  addPushed: (repo, sha) => {
    let shas = []
    try { shas = JSON.parse(read(localStorage, PUSHED_KEY + repo)) || [] } catch {}
    write(localStorage, PUSHED_KEY + repo, JSON.stringify([sha, ...shas.filter(s => s !== sha)].slice(0, PUSHED_MAX)))
  },
  // Everything tied to the signed-in account, every repo's local changes too (signing out says how many); theme stays
  clearSession: () => {
    let recents = []
    try { recents = Object.keys(localStorage).filter(key => [RECENT_KEY, PUSHED_KEY, CHANGES_KEY, REMINDERS_KEY, `${TRAILS_KEY}_`, `${PAGE_KEY}_`].some(prefix => key.startsWith(prefix))) } catch {}
    for (const key of recents) write(localStorage, key, null)
    for (const key of [TOKEN_KEY, REPO_KEY, REPOS_KEY, USER_KEY, ...Object.values(OLD_KEYS)]) write(localStorage, key, null)
    for (const key of [TRAILS_KEY, PAGE_KEY, PLANNER_DAYS_KEY]) write(sessionStorage, key, null)
  },
}

export const localChanges = {
  get: (repo) => {
    try { return JSON.parse(read(localStorage, CHANGES_KEY + repo)) } catch { return null }
  },
  // false when they couldn't be stored
  set: (repo, changes) => write(localStorage, CHANGES_KEY + repo, JSON.stringify(changes)),
  clear: (repo) => write(localStorage, CHANGES_KEY + repo, null),
  // Every repo's stored local changes but `except`'s: [repo, changes]
  others: (except) => {
    let keys = []
    try { keys = Object.keys(localStorage).filter(key => key.startsWith(CHANGES_KEY) && key !== CHANGES_KEY + except) } catch {}
    return keys.map(key => {
      try { return [key.slice(CHANGES_KEY.length), JSON.parse(read(localStorage, key))] } catch { return null }
    }).filter(entry => entry?.[1])
  },
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
