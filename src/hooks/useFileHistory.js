import { useState, useEffect, useRef, useMemo } from 'react'
import { commitPage, commitParent, fileOn, getBlob, isNetworkError } from '../lib/github.js'
import { cache } from '../lib/cache.js'
import { storage } from '../lib/storage.js'
import { mergedHistory } from '../lib/history.js'
import { versionsIn } from '../lib/versions.js'

const PAGE_SIZE = 20

// The versions on GitHub of the note at `path` there (null: it isn't there yet), newest first (lib/versions.js), each
// with `mine` (this device pushed it), its renames followed back: what was loaded before shows at once (the offline
// cache), then the latest are loaded, again when GitHub's latest commit (`head`) changes or the device comes back online.
// `more()` loads older ones (not while the latest load). `status`: 'loading' | 'more' | 'offline' | 'failed' | 'idle'; `retry()`. `textOf(version)`:
// its text; `textBefore(sha)`: the text of the version before the one of commit `sha` ('' for the first).
export function useFileHistory(repo, path, branch, head, online) {
  const [list, setList] = useState(null) // null until the cache is read
  const [status, setStatus] = useState('loading')
  const saved = useRef({ list: [], next: null }) // what's shown, and where the older versions are
  const run = useRef(0) // the latest load: an older one that finishes later is dropped

  const keep = next => { saved.current = next; setList(next.list); cache.setVersions(repo, path, next) }

  // Up to PAGE_SIZE versions from `at` ({ path, from }, lib/versions.js `versionsIn`) on, and where the rest are
  async function load(at) {
    const versions = []
    while (at && versions.length < PAGE_SIZE) {
      const { page, more: older } = await commitPage(branch, PAGE_SIZE, at.from, at.path)
      const found = versionsIn(page, at.path, older)
      versions.push(...found.versions)
      at = found.next
    }
    return { list: versions, next: at }
  }

  async function refresh() {
    const id = ++run.current
    if (!branch || !path) return setStatus('idle')
    if (!online) return setStatus('offline')
    setStatus('loading')
    try {
      const page = await load({ path })
      if (id !== run.current) return
      const merged = mergedHistory(page.list, saved.current.list)
      keep({ list: merged, next: merged.length > page.list.length ? saved.current.next : page.next })
      setStatus('idle')
    } catch (e) {
      if (id === run.current) setStatus(isNetworkError(e) ? 'offline' : 'failed')
    }
  }

  async function more() {
    if (!saved.current.next || status === 'loading' || status === 'more') return // a refresh going on would be dropped
    const id = ++run.current
    if (!online) return setStatus('offline')
    setStatus('more')
    try {
      const page = await load(saved.current.next)
      if (id !== run.current) return
      keep({ list: [...saved.current.list, ...page.list], next: page.next })
      setStatus('idle')
    } catch (e) {
      if (id === run.current) setStatus(isNetworkError(e) ? 'offline' : 'failed')
    }
  }

  useEffect(() => {
    let cancelled = false
    saved.current = { list: [], next: null }
    setList(null)
    if (!path) { setList([]); return }
    cache.getVersions(repo, path).then(found => {
      if (cancelled) return
      if (found && !saved.current.list.length) saved.current = found
      setList(saved.current.list)
    })
    return () => { cancelled = true }
  }, [repo, path])

  useEffect(() => { refresh() }, [repo, path, branch, head, online])

  // A version's text: its blob (kept on this device once read), found by its path at its commit when the list doesn't have it
  async function textOf(v) {
    const blob = v.blob ?? (await fileOn(v.path, v.sha))?.sha
    return blob ? getBlob(blob) : ''
  }

  // The text before the version of commit `sha`: the version under it, or what was at its path (its old one, renamed)
  // before its commit
  async function textBefore(sha) {
    const i = saved.current.list.findIndex(v => v.sha === sha)
    const v = saved.current.list[i]
    if (!v || v.status === 'added') return ''
    const older = saved.current.list[i + 1]
    if (older) return textOf(older)
    const parent = await commitParent(v.sha)
    const was = parent && await fileOn(v.from ?? v.path, parent)
    return was ? getBlob(was.sha) : ''
  }

  const pushed = useMemo(() => storage.getPushed(repo), [repo, head]) // a push here moves GitHub's latest commit
  const versions = useMemo(() => list && list.map(v => ({ ...v, mine: pushed.includes(v.sha) })), [list, pushed])
  return { versions, status, hasMore: Boolean(saved.current.next), busy: status === 'loading' || status === 'more', more, retry: refresh, textOf, textBefore }
}
