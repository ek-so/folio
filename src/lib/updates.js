import { registerSW } from 'virtual:pwa-register'

const IDLE_DELAY_MS = 300
const ASK_TIMEOUT_MS = 1000

const isTyping = () => document.activeElement?.matches('textarea, input')

// Whether the waiting service worker is the version of the open page: it lists
// the script this code is bundled in. Online, the page comes from the network
// (src/sw.js), so it's usually newer than the service worker that served it.
async function isThisPage() {
  const sw = (await navigator.serviceWorker.getRegistration())?.waiting
  if (!sw) return false
  return new Promise(resolve => {
    const channel = new MessageChannel()
    channel.port1.onmessage = e => resolve(e.data === true)
    sw.postMessage({ type: 'HAS_ASSET', url: import.meta.url }, [channel.port2])
    setTimeout(() => resolve(false), ASK_TIMEOUT_MS)
  })
}

// Keeps the installed app current. Checks for a new version on start and
// whenever the app comes back to the foreground (iOS resumes home-screen
// apps instead of restarting them). A new version takes over as soon as it's
// ready. The page reloads only when it's older than that version (an app
// left open), and not while a text field has focus; edits are saved on the
// way out (pagehide).
export function setupAutoUpdate() {
  let stale = true
  let waiting = false

  const applyUpdate = registerSW({
    immediate: true,
    async onNeedRefresh() {
      stale = !(await isThisPage())
      applyUpdate()
    },
    onNeedReload() {
      if (stale) reloadWhenIdle()
    },
    onRegisteredSW(_url, r) {
      if (!r) return
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') r.update().catch(() => {})
      })
    },
  })

  function reloadWhenIdle() {
    if (!isTyping()) return window.location.reload()
    if (waiting) return
    waiting = true
    document.addEventListener('focusout', () => setTimeout(() => { waiting = false; reloadWhenIdle() }, IDLE_DELAY_MS), { once: true })
  }
}
