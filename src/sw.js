import { precache, addRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'

// Folio's service worker. The app's files are precached so it opens offline,
// but the page itself comes from the network first: online, you always get the
// newest version right away, never an old cached one. Offline, or when the
// network doesn't answer within PAGE_TIMEOUT_MS, the cached page opens instead.

const PAGE_TIMEOUT_MS = 3000
const manifest = self.__WB_MANIFEST

// Before the precache route, which would answer the start page from the cache
registerRoute(new NavigationRoute(async ({ request }) => {
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), PAGE_TIMEOUT_MS))
    // A plain request (not the navigation itself) so it can skip the browser's HTTP cache
    const res = await Promise.race([fetch(request.url, { cache: 'no-cache' }), timeout])
    // A navigation can't take a redirected response; let the browser follow it
    return res.redirected ? Response.redirect(res.url) : res
  } catch {
    return (await matchPrecache('index.html')) ?? Response.error()
  }
}))

precache(manifest)
addRoute()
cleanupOutdatedCaches()

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
  // Whether this version includes `path` (the open page's script): if so, the
  // page is already this version and needs no reload to update (lib/updates.js)
  if (e.data?.type === 'HAS_ASSET') e.ports[0]?.postMessage(manifest.some(m => (typeof m === 'string' ? m : m.url) === e.data.path))
})
