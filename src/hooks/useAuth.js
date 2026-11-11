import { useState, useEffect } from 'react'
import { init, setRepo, getUser, isAuthError } from '../lib/github.js'
import { storage } from '../lib/storage.js'

function applyRepo(full) {
  const slash = full.indexOf('/')
  setRepo(full.slice(0, slash), full.slice(slash + 1))
}

// Token, user and repo. Starts from the cached user so the app opens
// offline; signs out only when GitHub rejects the token.
export function useAuth() {
  const [user, setUser] = useState(null)
  const [repo, setRepoState] = useState(null)
  const [ready, setReady] = useState(false)
  const [repos, setRepos] = useState(storage.getRepos) // used on this device, latest first
  const remember = full => { storage.addRepo(full); setRepos(storage.getRepos()) }

  useEffect(() => {
    const token = storage.getToken()
    if (!token) return setReady(true)
    init(token)
    const savedRepo = storage.getRepo()
    if (savedRepo) { applyRepo(savedRepo); remember(savedRepo) }

    const cachedUser = storage.getUser()
    if (cachedUser) {
      setUser(cachedUser)
      setRepoState(savedRepo)
      setReady(true)
    }
    getUser().then(u => {
      storage.setUser(u)
      setUser(u)
      setRepoState(savedRepo)
    }).catch(e => {
      if (isAuthError(e)) {
        storage.clearSession()
        setUser(null)
        setRepoState(null)
      }
    }).finally(() => setReady(true))
  }, [])

  // Back on the token step from the repo step (the sign-in's stepper): still signed in, the token shown to keep or change
  const [editingToken, setEditingToken] = useState(false)

  // Signs in with `token`; the same one again (back on the token step, unchanged) just goes on. A token GitHub
  // refuses leaves the one in use as it was
  async function authenticate(token) {
    if (user && token === storage.getToken()) return setEditingToken(false)
    init(token)
    let u
    try {
      u = await getUser()
    } catch (e) {
      const old = storage.getToken()
      if (old) init(old)
      throw e
    }
    storage.setToken(token)
    storage.setUser(u)
    setUser(u)
    setEditingToken(false)
  }

  function selectRepo(full) {
    applyRepo(full)
    storage.setRepo(full)
    remember(full)
    setRepoState(full)
  }

  // Open the app in another repo: a fresh start there, nothing carried over
  // but the page. Its local changes stay stored under each repo.
  function switchRepo(full) {
    storage.setRepo(full)
    storage.addRepo(full) // the app reloads: no state to update
    storage.clearRepoSession()
    window.location.assign(import.meta.env.BASE_URL)
  }

  function signOut() {
    setEditingToken(false)
    storage.clearSession()
    setUser(null)
    setRepoState(null)
  }

  return {
    user, repo, repos, ready, authenticate, selectRepo, switchRepo, signOut,
    editingToken, editToken: () => setEditingToken(true), token: () => storage.getToken() ?? '',
  }
}
