import { useEffect, useRef } from 'react'

// How often Folio checks GitHub for new commits while it's on screen, how long after the last change it pushes, and
// how long it leaves things alone after a failed try (the button still syncs at once)
export const PULL_EVERY_MS = 60 * 1000
export const PUSH_AFTER_MS = 30 * 1000
const PAUSE_AFTER_FAILURE_MS = 5 * 60 * 1000

// Sync by itself, so the Sync button is only a backup (`repo`: useRepo's). While the app is on screen and online:
//   - when it opens (and once back online), a full Sync;
//   - every PULL_EVERY_MS, and when it comes back to the screen or online, a check for new commits on GitHub (one cheap
//     request), pulled and merged when there are some; coming back to the screen, the content shows loading while
//     they're pulled, so what was there before never shows as current;
//   - PUSH_AFTER_MS after the last local change, a Sync (pull, merge, push); at once when the app goes off screen.
// Nothing runs while another step does or the app is hidden. All of it is quiet (no toasts when it works; a failure opens
// the error sheet as Sync's does, then it pauses for PAUSE_AFTER_FAILURE_MS). `blocked` (a count, e.g. broken links)
// stops pushing: `onBlocked()` says so once per count, the button and its check still work.
export function useAutoSync(repo, repoName, blocked, onBlocked) {
  const latest = useRef({})
  latest.current = { repo, blocked, onBlocked }
  const pausedUntil = useRef(0)
  const warned = useRef(0) // the blocked count already told
  const opened = useRef(null) // the repo synced on opening

  const ready = () => {
    const { repo } = latest.current
    return repo.remote && repo.online && !repo.syncing && !repo.syncError && Date.now() >= pausedUntil.current
  }
  const after = result => { if (result === 'failed') pausedUntil.current = Date.now() + PAUSE_AFTER_FAILURE_MS }
  const push = () => {
    const { repo, blocked, onBlocked } = latest.current
    if (!ready() || !repo.changeCount) return
    if (blocked) {
      if (warned.current !== blocked) { warned.current = blocked; onBlocked() }
      return
    }
    warned.current = 0
    repo.sync(true).then(after)
  }
  const pull = async (hide = false) => {
    if (!ready() || document.visibilityState !== 'visible') return
    if (await latest.current.repo.checkRemote() && ready()) after(await latest.current.repo.pullChanges(true, hide))
  }

  // Opening (or back online after opening offline): one full Sync, or a pull when pushing is blocked
  useEffect(() => {
    if (!repo.remote || !repo.online || opened.current === repoName) return
    if (repo.syncing) return // tried again when that step ends
    opened.current = repoName
    if (blocked) { warned.current = blocked; onBlocked(); pull() } else repo.sync(true).then(after)
  }, [repo.remote, repo.online, repo.syncing, repoName])

  // Pulling: on a timer, and when the app comes back to the screen or online
  useEffect(() => {
    const id = setInterval(pull, PULL_EVERY_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') pull(true); else push() } // going off screen: push now
    const onOnline = () => pull()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    window.addEventListener('pagehide', push)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('pagehide', push)
    }
  }, [])

  // Pushing: PUSH_AFTER_MS after the last change (each change starts the wait again; one made while a step runs is
  // picked up when it ends)
  useEffect(() => {
    if (!repo.changeCount) return
    const id = setTimeout(push, PUSH_AFTER_MS)
    return () => clearTimeout(id)
  }, [repo.changes, repo.syncing])
}
