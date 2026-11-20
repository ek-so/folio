import { useState, useEffect, useRef, useMemo } from 'react'
import { commitPage, isNetworkError } from '../lib/github.js'
import { cache } from '../lib/cache.js'
import { storage } from '../lib/storage.js'
import { commitEntry, mergedHistory } from '../lib/history.js'

const PAGE_SIZE = 20

// Recent updates' commits (lib/history.js) of `repo`'s `branch`, newest first, each with its files: what was loaded
// before shows at once (the offline cache), then the latest PAGE_SIZE are loaded, again whenever GitHub's latest commit
// (`head`) changes or the device comes back online. `more()` loads the PAGE_SIZE before the last one shown. A commit's
// files are asked for once, then kept. `status`: 'loading' | 'more' | 'offline' | 'failed' | 'idle'; `retry()`.
export function useHistory(repo, branch, head, online) {
  const [list, setList] = useState(null) // null until the cache is read
  const [status, setStatus] = useState('loading')
  const [hasMore, setHasMore] = useState(false)
  const listRef = useRef([])
  const run = useRef(0) // the latest refresh of the newest commits: an older one that finishes later is dropped
  const moreRun = useRef(0) // the latest Show more, the same way
  const shown = useRef(0) // which repo is shown: a load for another one that finishes later is dropped

  const keep = next => { listRef.current = next; setList(next); cache.setHistory(repo, next) }

  // A page of commits (github.js `commitPage`) as Recent updates lists them
  async function load(after) {
    const { page, more } = await commitPage(branch, PAGE_SIZE, after)
    return { page: page.map(({ commit, files }) => commitEntry(commit, files)), more }
  }

  // The newest commits, on top of what's shown
  async function refresh() {
    const id = ++run.current
    if (!branch) return
    if (!online) return setStatus('offline')
    setStatus('loading')
    try {
      const { page, more } = await load()
      if (id !== run.current) return
      keep(mergedHistory(page, listRef.current))
      if (listRef.current.length <= page.length) setHasMore(more)
      setStatus('idle')
    } catch (e) {
      if (id === run.current) setStatus(isNetworkError(e) ? 'offline' : 'failed')
    }
  }

  // The PAGE_SIZE before the last one shown
  async function more() {
    const id = ++moreRun.current
    const of = shown.current
    const last = listRef.current.at(-1)
    if (!branch || !last) return
    if (!online) return setStatus('offline')
    setStatus('more')
    try {
      const { page, more } = await load(last.sha)
      if (id !== moreRun.current || of !== shown.current) return
      keep([...listRef.current, ...page])
      setHasMore(more)
      setStatus('idle')
    } catch (e) {
      if (id === moreRun.current && of === shown.current) setStatus(isNetworkError(e) ? 'offline' : 'failed')
    }
  }

  useEffect(() => {
    let cancelled = false
    shown.current++
    listRef.current = []
    setList(null)
    cache.getHistory(repo).then(saved => {
      if (cancelled) return
      if (saved && !listRef.current.length) { listRef.current = saved; setHasMore(true) }
      setList(listRef.current)
    })
    return () => { cancelled = true }
  }, [repo])

  useEffect(() => { refresh() }, [repo, branch, head, online])

  const pushed = useMemo(() => storage.getPushed(repo), [repo, head]) // a push here moves GitHub's latest commit
  const commits = useMemo(() => list && list.map(c => ({ ...c, mine: pushed.includes(c.sha) })), [list, pushed])
  return { commits, status, hasMore, more, retry: refresh }
}
