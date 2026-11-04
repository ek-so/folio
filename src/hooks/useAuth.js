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

  useEffect(() => {
    const token = storage.getToken()
    if (!token) return setReady(true)
    init(token)
    const savedRepo = storage.getRepo()
    if (savedRepo) { applyRepo(savedRepo); storage.addRepo(savedRepo) }

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

  async function authenticate(token) {
    init(token)
    const u = await getUser()
    storage.setToken(token)
    storage.setUser(u)
    setUser(u)
  }

  function selectRepo(full) {
    applyRepo(full)
    storage.setRepo(full)
    storage.addRepo(full)
    setRepoState(full)
  }

  // Open the app in another repo: a fresh start there, nothing carried over
  // but the page. Its local changes stay stored under each repo.
  function switchRepo(full) {
    storage.setRepo(full)
    storage.addRepo(full)
    storage.clearRepoSession()
    window.location.assign(import.meta.env.BASE_URL)
  }

  function signOut() {
    storage.clearSession()
    setUser(null)
    setRepoState(null)
  }

  return { user, repo, ready, authenticate, selectRepo, switchRepo, signOut }
}
