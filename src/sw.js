import { precache, addRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'

// Folio's service worker. The app's files are precached so it opens offline,
// but the page itself comes from the network first: online, you always get the
// newest version right away, never an old cached one. Offline, when the
// network doesn't answer within PAGE_TIMEOUT_MS, or when it answers with an
// error (GitHub down, a Wi-Fi login page), the cached page opens instead.

const PAGE_TIMEOUT_MS = 3000
const manifest = self.__WB_MANIFEST

// Before the precache route, which would answer the start page from the cache
registerRoute(new NavigationRoute(async ({ request }) => {
  // Gives up on a network that doesn't answer in time; once it answers, the page loads however long it takes
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), PAGE_TIMEOUT_MS)
  try {
    // A plain request (not the navigation itself) so it can skip the browser's HTTP cache
    const res = await fetch(request.url, { cache: 'no-cache', signal: abort.signal })
    // GitHub Pages answers a deep link with 404.html, which is the app; any other error isn't
    if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`)
    // A navigation can't take a redirected response; let the browser follow it
    return res.redirected ? Response.redirect(res.url) : res
  } catch {
    return (await matchPrecache('index.html')) ?? Response.error()
  } finally {
    clearTimeout(timer)
  }
}))

precache(manifest)
addRoute()
cleanupOutdatedCaches()

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
  // Whether this version includes `url` (the open page's own script): if so,
  // the page is already this version and needs no reload to update (lib/updates.js)
  if (e.data?.type === 'HAS_ASSET') {
    const has = manifest.some(m => new URL(typeof m === 'string' ? m : m.url, self.registration.scope).href === e.data.url)
    e.ports[0]?.postMessage(has)
  }
})
