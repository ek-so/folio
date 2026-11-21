import { useEffect, useRef, useState } from 'react'
import { pageForUrl, urlForPage, existingView } from '../lib/url.js'
import { trailTo } from '../lib/views.js'

const DEPTH_KEY = 'folio_history_depth' // how many of the app's own steps this tab's history holds (sessionStorage)
const readDepth = () => { try { return Number(sessionStorage.getItem(DEPTH_KEY)) || 0 } catch { return 0 } }
const writeDepth = n => { try { sessionStorage.setItem(DEPTH_KEY, String(n)) } catch { /* not kept: Forward may stay off */ } }

// The browser's address kept in step with the page you're on and its view (`url`): each new page, folder or file is a
// history entry, so Back and Forward move between them. Back / Forward show the folder or file the address names, or
// what's left of it (`known()`: { files, folders } as they are now), through `setPage` and `setTrails`. `base`: the
// app's base path. Each entry the app makes carries its step (`history.state.step`, 0 for the first), and the tab
// remembers how many steps there are, so the title bar's Back and Forward know when there's one to go to (`canBack`,
// `canForward`) and never leave the app. Returns { replaceNext() (the next change of address replaces the history entry
// instead: a rename or delete followed), back(), forward(), canBack, canForward }.
export function useAddressBar(base, url, known, setPage, setTrails) {
  const started = useRef(false) // false until the first address is set (replaced, not pushed)
  const replacing = useRef(false)
  const knownRef = useRef(known)
  knownRef.current = known
  const [step, setStep] = useState(() => history.state?.step ?? 0)
  const [depth, setDepth] = useState(() => Math.max(readDepth(), history.state?.step ?? 0))

  useEffect(() => {
    if (!url) return
    const here = window.location.pathname + window.location.search
    if (here !== url) {
      if (started.current && !replacing.current) {
        const next = (history.state?.step ?? 0) + 1
        history.pushState({ step: next }, '', url)
        setStep(next)
        setDepth(next) // what was ahead is gone
        writeDepth(next)
      } else history.replaceState({ ...history.state, step: history.state?.step ?? 0 }, '', url)
    } else if (history.state?.step === undefined) history.replaceState({ ...history.state, step: 0 }, '', url)
    started.current = true
    replacing.current = false
  }, [url])

  useEffect(() => {
    const onPop = () => {
      setStep(history.state?.step ?? 0)
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

  return {
    replaceNext: () => { replacing.current = true },
    back: () => { if (step > 0) history.back() },
    forward: () => { if (step < depth) history.forward() },
    canBack: step > 0,
    canForward: step < depth,
  }
}
