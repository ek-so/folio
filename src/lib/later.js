import { createElement, lazy } from 'react'

// A component the first screen doesn't need (a page, a widget, the date picker's calendar): its code is a file of its
// own, so the app's main file is smaller and the first screen shows sooner. It's fetched as soon as the browser is idle
// after starting (the service worker has it cached, so offline too), or at once if it's shown before that; render it
// inside a `Later` (components/Later.jsx: a Suspense, and what's shown when its code can't be fetched, with Try again).
// `load`: () => import('…'), whose default export is the component, or `pick` it from the module. A fetch that failed
// is made again after Try again (`retryLater`; React keeps a failed lazy component failed, so a new one is made then).
export function later(load, pick = m => m.default) {
  let loading
  const fetch = () => (loading ??= load())
  const idle = globalThis.requestIdleCallback ?? (fn => setTimeout(fn, 1000))
  idle(() => fetch().catch(() => {})) // a failed fetch is tried again when it's shown
  let failed = false
  let tried = attempt
  const make = () => lazy(() => fetch().then(m => ({ default: pick(m) })).catch(error => { loading = null; failed = true; throw error }))
  let current = make()
  return function Later(props) {
    // Shown again after Try again (`retryLater`): fetched anew. Not on any other render, or a failed fetch would be
    // tried again and again before the error is shown
    if (failed && tried !== attempt) { failed = false; tried = attempt; current = make() }
    return createElement(current, props)
  }
}

let attempt = 0 // how many times Try again was pressed

// Try again (components/Later.jsx): the components whose code couldn't be fetched fetch it anew when shown next
export function retryLater() { attempt++ }
