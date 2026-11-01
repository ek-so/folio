import { Octokit } from '@octokit/rest'
import { cache } from './cache.js'

let octokit = null
let owner = null
let repo = null
let branch = null

export function init(token) {
  octokit = new Octokit({ auth: token })
}

export function setRepo(ownerVal, repoVal) {
  owner = ownerVal
  repo = repoVal
  branch = null
}

// No response from GitHub at all (offline, DNS, CORS) as opposed to an HTTP
// error. Octokit reports these as an HttpError without a response; any other
// error (e.g. a bug in Folio) is not "offline".
export function isNetworkError(e) {
  return e?.name === 'HttpError' && !e.response
}

export function isAuthError(e) {
  return e?.status === 401
}

export async function getUser() {
  const { data } = await octokit.rest.users.getAuthenticated()
  return data
}

// Throws if the repo doesn't exist or the token can't see it.
export async function checkRepo() {
  await octokit.rest.repos.get({ owner, repo })
}

function decode(base64) {
  return decodeURIComponent(escape(atob(base64)))
}

async function getDefaultBranch() {
  if (!branch) {
    const { data } = await octokit.rest.repos.get({ owner, repo })
    branch = data.default_branch
  }
  return branch
}

// fetch that bypasses the browser HTTP cache. Used for branch/commit endpoints
// whose responses GitHub caches for 60s — without this, syncing within 60s of a
// remote edit returns a stale tree and the old file content.
const fetchFresh = (url, opts) => fetch(url, { ...opts, cache: 'no-cache' })

// Latest commit SHA on the default branch — cheap single request, no tree.
export async function getLatestCommitSha() {
  const branchName = await getDefaultBranch()
  const { data } = await octokit.rest.repos.getBranch({ owner, repo, branch: branchName, request: { fetch: fetchFresh } })
  return data.commit.sha
}

// Tags errors with the sync step they happened in, for the error details sheet
const step = (name, promise) => promise.catch(e => {
  if (e && typeof e === 'object' && !e.step) e.step = name
  throw e
})

// Latest commit on the default branch with every file in its tree.
// `truncated` is set when GitHub couldn't list the whole tree.
export async function getTree() {
  const branchName = await step('read', getDefaultBranch())
  const { data } = await step('read', octokit.rest.repos.getBranch({ owner, repo, branch: branchName, request: { fetch: fetchFresh } }))
  const treeSha = data.commit.commit.tree.sha
  const { data: tree } = await step('read', octokit.rest.git.getTree({ owner, repo, tree_sha: treeSha, recursive: 'true' }))
  const files = {}
  for (const item of tree.tree) {
    if (item.type === 'blob') files[item.path] = { sha: item.sha, mode: item.mode }
  }
  return { branch: branchName, commitSha: data.commit.sha, treeSha, files, truncated: tree.truncated }
}

// Raw base64 of a blob, from the offline cache when possible.
export async function getBlobBase64(sha) {
  const cached = await cache.getBlob(sha)
  if (cached !== undefined) return cached
  const { data } = await octokit.rest.git.getBlob({ owner, repo, file_sha: sha })
  const base64 = data.content.replace(/\n/g, '')
  await cache.setBlob(sha, base64)
  return base64
}

export async function getBlob(sha) {
  return decode(await getBlobBase64(sha))
}

// Creates one commit on top of `remote` with the given tree entries.
// Returns the new commit's and tree's shas.
export async function commitTree(remote, entries, message) {
  const { data: tree } = await step('upload', octokit.rest.git.createTree({
    owner, repo, base_tree: remote.treeSha, tree: entries,
  }))
  const { data: commit } = await step('upload', octokit.rest.git.createCommit({
    owner, repo, message, tree: tree.sha, parents: [remote.commitSha],
  }))
  await step('save', octokit.rest.git.updateRef({ owner, repo, ref: `heads/${remote.branch}`, sha: commit.sha }))
  return { commitSha: commit.sha, treeSha: tree.sha }
}

// Git's sha for a blob with these bytes, the same GitHub gives it
export async function blobShaOf(bytes) {
  const head = new TextEncoder().encode(`blob ${bytes.length}\0`)
  const all = new Uint8Array(head.length + bytes.length)
  all.set(head)
  all.set(bytes, head.length)
  const hash = await crypto.subtle.digest('SHA-1', all)
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// Git's sha for a blob holding `text` (UTF-8)
export const blobSha = text => blobShaOf(new TextEncoder().encode(text))

// base64 of raw bytes, the form blobs are cached in
export function toBase64(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

// base64 of `text` as UTF-8
export const encodeText = text => toBase64(new TextEncoder().encode(text))

// Uploads a file added on this device (cached under its sha) so a commit can
// use it. A missing copy means the device's storage was cleared.
export async function uploadBlob(sha) {
  const base64 = await cache.getBlob(sha)
  if (base64 === undefined) {
    throw Object.assign(new Error('A file added on this device is no longer stored here. Discard it and add it again.'), { step: 'upload' })
  }
  await step('upload', octokit.rest.git.createBlob({ owner, repo, content: base64, encoding: 'base64' }))
}
