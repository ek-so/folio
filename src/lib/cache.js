import { get, set, del, keys, delMany } from 'idb-keyval'

// Offline copies in IndexedDB. Blobs are keyed by their git sha, so a cached
// blob never goes stale; the tree is the last one fetched for each repo.

export const cache = {
  getTree: (repo) => get(`tree:${repo}`).catch(() => undefined),
  setTree: (repo, tree) => set(`tree:${repo}`, tree).catch(() => {}),
  getBlob: (sha) => get(`blob:${sha}`).catch(() => undefined),
  setBlob: (sha, base64) => set(`blob:${sha}`, base64).catch(() => {}),
  deleteBlob: (sha) => del(`blob:${sha}`).catch(() => {}),
  hasBlob: async (sha) => (await get(`blob:${sha}`).catch(() => undefined)) !== undefined,
  // Recent updates: the commits last listed for each repo, and each commit's files (a commit never changes)
  getHistory: (repo) => get(`history:${repo}`).catch(() => undefined),
  setHistory: (repo, list) => set(`history:${repo}`, list).catch(() => {}),
  getCommitFiles: (sha) => get(`commit:${sha}`).catch(() => undefined),
  setCommitFiles: (sha, files) => set(`commit:${sha}`, files).catch(() => {}),
  clearAll: async () => {
    try { await delMany(await keys()) } catch {}
  },
}
