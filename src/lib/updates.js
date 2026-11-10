import { registerSW } from 'virtual:pwa-register'

const IDLE_DELAY_MS = 300
const ASK_TIMEOUT_MS = 1000

const isTyping = () => document.activeElement?.matches('textarea, input')

// Whether the service worker `sw` is the version of the open page: it lists the
// page's own script. Online, the page comes from the network (src/sw.js), so
// it's usually newer than the service worker that served it.
function isThisPage(sw) {
  const src = document.querySelector('script[type="module"][src]')?.getAttribute('src')
  if (!sw || !src) return Promise.resolve(false)
  const path = new URL(src, location.href).pathname.slice(import.meta.env.BASE_URL.length)
  return new Promise(resolve => {
    const channel = new MessageChannel()
    channel.port1.onmessage = e => resolve(e.data === true)
    sw.postMessage({ type: 'HAS_ASSET', path }, [channel.port2])
    setTimeout(() => resolve(false), ASK_TIMEOUT_MS)
  })
}

// Keeps the installed app current. Checks for a new version on start and
// whenever the app comes back to the foreground (iOS resumes home-screen
// apps instead of restarting them). When a new version is ready: if the open
// page already is that version, it takes over quietly; otherwise the page
// reloads, but not while a text field has focus; edits are saved on the way
// out (pagehide).
export function setupAutoUpdate() {
  let ready = false
  let reload = true
  let registration = null

  const applyUpdate = registerSW({
    immediate: true,
    async onNeedRefresh() {
      reload = !(await isThisPage(registration?.waiting))
      if (!reload) return applyUpdate()
      ready = true
      applyWhenIdle()
    },
    onNeedReload() {
      if (reload) window.location.reload()
    },
    onRegisteredSW(_url, r) {
      if (!r) return
      registration = r
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') r.update().catch(() => {})
      })
    },
  })

  function applyWhenIdle() {
    if (!ready) return
    if (isTyping()) {
      document.addEventListener('focusout', () => setTimeout(applyWhenIdle, IDLE_DELAY_MS), { once: true })
      return
    }
    ready = false
    applyUpdate()
  }
}
