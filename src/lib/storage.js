const RECENT_KEY = 'folio_recent'
const TOKEN_KEY = 'brain_gh_token'
const REPO_KEY = 'brain_gh_repo'
const USER_KEY = 'folio_user'
const THEME_KEY = 'folio_theme'
const FOLDER_KEY = 'folio_folder'
const FILE_KEY = 'folio_file'
const SETTINGS_KEY = 'folio_settings'
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
  getTheme: () => read(localStorage, THEME_KEY),
  setTheme: (theme) => write(localStorage, THEME_KEY, theme),
  // Session-only, so a reload keeps the current folder, open note and Settings
  getFolder: () => read(sessionStorage, FOLDER_KEY) || '',
  setFolder: (folder) => write(sessionStorage, FOLDER_KEY, folder),
  getFile: () => read(sessionStorage, FILE_KEY),
  setFile: (path) => write(sessionStorage, FILE_KEY, path),
  getSettingsOpen: () => read(sessionStorage, SETTINGS_KEY) === '1',
  setSettingsOpen: (open) => write(sessionStorage, SETTINGS_KEY, open ? '1' : null),
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
  // Everything tied to the signed-in account; theme stays
  clearSession: () => {
    for (const key of [TOKEN_KEY, REPO_KEY, USER_KEY]) write(localStorage, key, null)
    for (const key of [FOLDER_KEY, FILE_KEY, SETTINGS_KEY, RECENT_KEY]) write(sessionStorage, key, null)
  },
}

export const localChanges = {
  get: (repo) => {
    try { return JSON.parse(read(localStorage, CHANGES_KEY + repo)) } catch { return null }
  },
  set: (repo, changes) => write(localStorage, CHANGES_KEY + repo, JSON.stringify(changes)),
  clear: (repo) => write(localStorage, CHANGES_KEY + repo, null),
}
