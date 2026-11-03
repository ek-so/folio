import { useState, useEffect, useMemo } from 'react'
import { getBlob } from '../lib/github.js'
import { resolveSymlink, SYMLINK_MODE } from '../lib/links.js'

// Where every symlink in `virtual` points: path -> { kind, path } (see
// resolveSymlink), { error: 'outside' | 'missing' }, { error: 'unavailable' }
// when its content isn't on this device and can't be fetched, or undefined
// while loading. Link contents come through the offline cache.
export function useSymlinks(virtual) {
  const [texts, setTexts] = useState({}) // blob sha -> target text, or null if unavailable

  const links = useMemo(() => Object.entries(virtual).filter(([, e]) => e.mode === SYMLINK_MODE), [virtual])

  useEffect(() => {
    const missing = [...new Set(links.map(([, e]) => e.sha))].filter(sha => sha && !(sha in texts))
    if (!missing.length) return
    let cancelled = false
    Promise.all(missing.map(sha => getBlob(sha).then(t => [sha, t], () => [sha, null]))).then(entries => {
      if (!cancelled) setTexts(prev => ({ ...prev, ...Object.fromEntries(entries) }))
    })
    return () => { cancelled = true }
  }, [links])

  return useMemo(() => {
    const byPath = Object.fromEntries(links.filter(([, e]) => texts[e.sha]).map(([p, e]) => [p, texts[e.sha]]))
    const result = {}
    for (const [path, entry] of links) {
      const text = texts[entry.sha]
      result[path] = text === undefined ? undefined
        : text === null ? { error: 'unavailable' }
        : resolveSymlink(path, text, virtual, byPath)
    }
    return result
  }, [links, texts, virtual])
}
