import { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { getTree, getBlobBase64, commitTree, isNetworkError, getLatestCommitSha, changedFileCount, blobSha, encodeText, uploadBlob } from '../lib/github.js'
import { cache } from '../lib/cache.js'
import { localChanges } from '../lib/storage.js'
import { describeSyncError } from '../lib/syncErrors.js'
import {
  empty, normalize, count, virtualFiles, changedPaths, conflicts, discard, settle, treeEntries, commitMessage, filesAfter,
} from '../lib/changes.js'

const PREFETCH_WORKERS = 4
const UNSAVED = 'unsaved-changes' // the toast shown while local changes can't be stored

// Download every note not yet on this device, so all of them open offline.
async function downloadNotes(files) {
  const shas = [...new Set(
    Object.entries(files).filter(([path]) => path.endsWith('.md')).map(([, f]) => f.sha)
  )]
  const queue = []
  for (const sha of shas) if (!(await cache.hasBlob(sha))) queue.push(sha)
  const worker = async () => {
    while (queue.length) {
      try {
        await getBlobBase64(queue.pop())
      } catch (e) {
        if (isNetworkError(e)) return // offline: the rest would fail too
      }
    }
  }
  await Promise.all(Array.from({ length: PREFETCH_WORKERS }, worker))
}

// One download at a time; a request while one runs is done right after it,
// with the newest tree.
let prefetching = false
let prefetchNext = null
async function prefetchNotes(files) {
  if (prefetching) {
    prefetchNext = files
    return
  }
  prefetching = true
  try {
    await downloadNotes(files)
  } finally {
    prefetching = false
  }
  if (prefetchNext) {
    const next = prefetchNext
    prefetchNext = null
    prefetchNotes(next)
  }
}

// Remote tree + local changes for one repo, and syncing between them.
// Works offline from the last tree and notes saved on this device.
// `onDone(message)` is called after a sync step succeeds (App shows a toast).
export function useRepo(repo, onDone) {
  const [remote, setRemote] = useState(null)
  const remoteRef = useRef(null)
  const [error, setError] = useState('')
  const [online, setOnline] = useState(() => navigator.onLine)
  const [changes, setChanges] = useState(empty)
  const changesRef = useRef(changes)
  const [conflictPaths, setConflictPaths] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [syncState, setSyncState] = useState('idle') // idle | error | offline
  // GitHub has commits this device hasn't pulled: { files } (changed-file
  // count, null when unknown), or null when up to date
  const [incoming, setIncoming] = useState(null)
  const [syncError, setSyncError] = useState(null) // { ...describeSyncError(), retry } after a failed action
  const knownCommitSha = useRef(null)
  const busy = useRef(false) // a sync step is running: another waits for none, it's ignored (a double tap)
  const flashTimer = useRef()

  useEffect(() => {
    if (!repo) return
    changesRef.current = normalize(localChanges.get(repo))
    setChanges(changesRef.current)
    setRemoteTree(null)
    setError('')
    let cancelled = false
    // Files on this device stay as they are until Sync or Pull: a saved tree
    // is only checked against GitHub (the Sync badge shows if it's behind).
    // Only a repo never opened here is downloaded.
    cache.getTree(repo).then(tree => {
      if (cancelled) return
      if (tree?.commitSha && !remoteRef.current) {
        setRemoteTree(tree)
        knownCommitSha.current = tree.commitSha
        prefetchNotes(tree.files)
        checkRemote()
      } else refresh()
    })
    return () => { cancelled = true }
  }, [repo])

  useEffect(() => {
    const goOnline = () => { setOnline(true); remoteRef.current ? checkRemote() : refresh() }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [repo])

  useEffect(() => {
    if (!repo) return
    const id = setInterval(checkRemote, 3 * 60 * 1000)
    const onVisible = () => { if (document.visibilityState === 'visible') checkRemote() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [repo])

  useEffect(() => () => clearTimeout(flashTimer.current), [])

  const virtual = useMemo(() => remote ? virtualFiles(remote.files, changes) : {}, [remote, changes])
  const changed = useMemo(() => changedPaths(changes), [changes])

  function setRemoteTree(tree) {
    remoteRef.current = tree
    setRemote(tree)
  }

  function update(fn) {
    const prev = changesRef.current
    const next = fn(prev)
    changesRef.current = next
    keep(next)
    setChanges(next)
    dropUnusedUploads(prev, next)
  }

  // The local changes stored on this device; when they can't be (storage full), a message that stays until they are
  function keep(next) {
    if (localChanges.set(repo, next)) return toast.dismiss(UNSAVED)
    toast.error("Changes can't be saved on this device: its storage is full. Sync now, or they're lost when Folio closes.", { id: UNSAVED, duration: Infinity })
  }

  // Bytes of files added on this device that no change uses any more
  // (discarded, deleted, replaced again) and GitHub doesn't have
  function dropUnusedUploads(prev, next) {
    const kept = new Set(Object.values(next.uploads))
    const remoteShas = new Set(Object.values(remoteRef.current?.files ?? {}).map(f => f.sha))
    for (const sha of new Set(Object.values(prev.uploads))) {
      if (!kept.has(sha) && !remoteShas.has(sha)) cache.deleteBlob(sha)
    }
  }

  async function pull() {
    const latest = await getTree()
    setRemoteTree(latest)
    setOnline(true)
    cache.setTree(repo, latest)
    prefetchNotes(latest.files)
    knownCommitSha.current = latest.commitSha
    setIncoming(null)
    return latest
  }

  // Whether GitHub has commits this device hasn't pulled; downloads nothing
  async function checkRemote() {
    if (!navigator.onLine || !knownCommitSha.current) return
    try {
      const sha = await getLatestCommitSha()
      setOnline(true)
      const known = knownCommitSha.current
      if (sha === known) return setIncoming(null)
      const files = await changedFileCount(known, sha)
      if (knownCommitSha.current === known) setIncoming({ files }) // not pulled meanwhile
    } catch (e) {
      if (isNetworkError(e)) setOnline(false)
    }
  }

  function handleError(e) {
    if (!isNetworkError(e)) return setError('Failed to load files.')
    setOnline(false)
    if (!remoteRef.current) setError('You\'re offline, and this repo isn\'t saved on this device yet.')
  }

  // Fetch the latest tree; warn about conflicts with local changes
  async function fetchLatest() {
    const latest = await pull()
    setError('')
    setConflictPaths(conflicts(changesRef.current, latest.files))
  }

  async function refresh() {
    try {
      await fetchLatest()
    } catch (e) {
      handleError(e)
    }
  }

  function flash(state) {
    clearTimeout(flashTimer.current)
    setSyncState(state)
    flashTimer.current = setTimeout(() => setSyncState('idle'), 2000)
  }

  // Commit all local changes on top of `latest`. Changes made while the
  // commit was in flight are kept. GitHub's new state is worked out here
  // rather than fetched, so a dropped connection right after the commit
  // can't leave pushed changes looking unsynced.
  async function push(latest) {
    const committed = changesRef.current
    if (!count(committed)) return
    const onGitHub = new Set(Object.values(latest.files).map(f => f.sha)) // a duplicate's bytes may be there already
    for (const sha of new Set(Object.values(committed.uploads))) if (!onGitHub.has(sha)) await uploadBlob(sha)
    const { commitSha, treeSha } = await commitTree(latest, treeEntries(committed, latest.files), commitMessage(committed))
    const editShas = {}
    for (const [orig, text] of Object.entries(committed.edits)) {
      editShas[orig] = await blobSha(text)
      cache.setBlob(editShas[orig], encodeText(text))
    }
    const after = { ...latest, commitSha, treeSha, files: filesAfter(latest.files, committed, editShas) }
    setRemoteTree(after)
    cache.setTree(repo, after)
    knownCommitSha.current = commitSha
    update(current => settle(current, committed, after.files))
    pull().catch(() => {}) // anything else that changed; offline is fine
  }

  // Runs a sync step, after the typing in an open note is saved; one at a time (one asked for meanwhile is ignored): success reports through onDone, failure flashes on the Sync
  // button; `quiet` reports nothing on success (the automatic sync). A task returning false ends without a toast (e.g. stopped for
  // conflicts). Offline isn't an error (the button says Offline); anything
  // else opens the error sheet, whose Try again repeats `retry`. Resolves to whether it ran (false: another step was running).
  async function run(task, retry, doneMessage = 'Synced', quiet = false) {
    if (busy.current) return false
    busy.current = true
    window.dispatchEvent(new Event('folio:flush')) // typing in an open note first
    setSyncing(true)
    setSyncError(null)
    try {
      if (await task() !== false && !quiet) onDone?.(doneMessage)
    } catch (e) {
      if (isNetworkError(e)) {
        setOnline(false)
        flash('offline')
      } else {
        flash('error')
        setSyncError({ ...describeSyncError(e), retry })
      }
    }
    busy.current = false
    setSyncing(false)
    return true
  }

  // `quiet`: no "Synced" toast when it works (the automatic sync when Folio opens)
  function sync(quiet = false) {
    return run(async () => {
      const latest = await pull()
      setError('')
      const conflicted = conflicts(changesRef.current, latest.files)
      if (conflicted.length) {
        setConflictPaths(conflicted)
        return false
      }
      await push(latest)
    }, () => sync(), 'Synced', quiet)
  }

  // Pull only, from the Sync menu; local changes stay
  function pullChanges() {
    return run(fetchLatest, pullChanges, 'Pulled')
  }

  function pushLocal() {
    return run(async () => {
      await push(await pull())
      setConflictPaths([])
    }, pushLocal)
  }

  function takeRemote() {
    update(ch => discard(ch, conflictPaths))
    setConflictPaths([])
  }

  // Drop every local change, including typing not yet reported by an open note
  function discardAll() {
    window.dispatchEvent(new Event('folio:flush'))
    setConflictPaths([])
    localChanges.clear(repo)
    toast.dismiss(UNSAVED)
    const prev = changesRef.current
    changesRef.current = empty()
    setChanges(changesRef.current)
    dropUnusedUploads(prev, changesRef.current)
  }

  return {
    remote, error, online, virtual, changes, changed, changeCount: count(changes),
    conflictPaths, dismissConflicts: () => setConflictPaths([]),
    syncing, syncState, incoming, syncError, dismissSyncError: () => setSyncError(null), update, sync, pullChanges, pushLocal, takeRemote, discardAll,
  }
}
