import { lazy } from 'react'

// A component the first screen doesn't need (a page, a widget, the date picker's calendar): its code is a file of its
// own, so the app's main file is smaller and the first screen shows sooner. It's fetched as soon as the browser is idle
// after starting (the service worker has it cached, so offline too), or at once if it's shown before that; render it
// inside a Suspense. `load`: () => import('…'), whose default export is the component, or `pick` it from the module.
export function later(load, pick = m => m.default) {
  let loading
  const fetch = () => (loading ??= load())
  const idle = globalThis.requestIdleCallback ?? (fn => setTimeout(fn, 1000))
  idle(() => fetch().catch(() => {})) // a failed fetch is tried again when it's shown
  return lazy(() => fetch().then(m => ({ default: pick(m) })).catch(error => { loading = null; throw error }))
}
