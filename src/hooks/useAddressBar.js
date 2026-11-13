import { useEffect, useRef } from 'react'
import { pageForUrl, urlForPage, existingView } from '../lib/url.js'
import { trailTo } from '../lib/views.js'

// The browser's address kept in step with the main page you're on and its view (`url`; null on Settings, Broken links,
// Documentation and Assets, which leave it as it is): each new page, folder or file is a history entry, so Back and
// Forward move between them. Back / Forward show the folder or file the address names, or what's left of it
// (`known()`: { files, folders } as they are now), through `setPage` and `setTrails`. `base`: the app's base path.
// Returns `replaceNext()`: the next change of address replaces the history entry instead (a rename or delete followed).
export function useAddressBar(base, url, known, setPage, setTrails) {
  const started = useRef(false) // false until the first address is set (replaced, not pushed)
  const replacing = useRef(false)
  const knownRef = useRef(known)
  knownRef.current = known

  useEffect(() => {
    if (!url) return
    const here = window.location.pathname + window.location.search
    if (here !== url) {
      if (started.current && !replacing.current) history.pushState(null, '', url)
      else history.replaceState(history.state, '', url)
    }
    started.current = true
    replacing.current = false
  }, [url])

  useEffect(() => {
    const onPop = () => {
      const found = pageForUrl(base, window.location.pathname, window.location.search)
      if (!found) return
      window.dispatchEvent(new Event('folio:flush')) // typing in an open note first
      let { page: to, view } = found
      const { files, folders } = knownRef.current()
      if (view && files.size) view = existingView(view, files, folders)
      if (urlForPage(base, to, view) !== window.location.pathname + window.location.search) replacing.current = true
      setPage(to)
      setTrails(o => ({ ...o, [to]: trailTo(to, o[to], view) }))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return () => { replacing.current = true }
}
