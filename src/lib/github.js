import { Octokit as Core } from '@octokit/core'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import { cache } from './cache.js'

// GitHub's REST API by route ('GET /repos/{owner}/{repo}'): Octokit's core with paging only, not @octokit/rest, whose
// named method for every endpoint would put GitHub's whole API list in the app's main file
const Octokit = Core.plugin(paginateRest)
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
  const { data } = await octokit.request('GET /user')
  return data
}

// Throws if the repo `owner`/`name` doesn't exist or the token can't see it
// (the repo in use stays as it is).
export async function checkRepo(owner, name) {
  await octokit.request('GET /repos/{owner}/{repo}', { owner, repo: name })
}

// The repos the token can reach, sorted by name, a page of 100 at a time (so a long
// list shows while the rest loads), each `{ full, canWrite }`. `canWrite` is the
// user's own access, which the token's can narrow: `canWriteRepo` checks the token.
export async function* listRepos() {
  for await (const { data } of octokit.paginate.iterator('GET /user/repos', { per_page: 100, sort: 'full_name' })) {
    yield data.map(r => ({ full: r.full_name, canWrite: !!r.permissions?.push }))
  }
}

// Creates a private repo `name` under the signed-in user's account, with a first commit (so it isn't
// empty), and returns its full name. Throws an HttpError: 422 the name is taken, 403/404 the token can't create repos.
export async function createRepo(name) {
  const { data } = await octokit.request('POST /user/repos', { name, private: true, auto_init: true })
  return data.full_name
}

// Whether the token itself can write to `owner/name` (save notes there): stores an
// empty blob, the request a sync's upload makes, which nothing points to. Throws
// when GitHub can't be asked (offline). An empty repo can't take a blob yet; it passes.
export async function canWriteRepo(owner, name) {
  try {
    await octokit.request('POST /repos/{owner}/{repo}/git/blobs', { owner, repo: name, content: '', encoding: 'utf-8' })
    return true
  } catch (e) {
    if (e.status === 403 || e.status === 404) return false
    if (e.status === 409) return true
    throw e
  }
}

// A blob's text, UTF-8. Bytes that aren't (a note saved in another encoding) throw a `notText` error rather than being
// shown changed: saving them back would replace those characters for good
const utf8 = new TextDecoder('utf-8', { fatal: true })
function decode(base64) {
  try {
    return utf8.decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0)))
  } catch {
    throw Object.assign(new Error('This file isn\'t UTF-8 text.'), { notText: true })
  }
}

// The file isn't text Folio can read (decode), as opposed to not reaching GitHub
export const isNotText = e => !!e?.notText

async function getDefaultBranch() {
  if (!branch) {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}', { owner, repo })
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
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', { owner, repo, branch: branchName, request: { fetch: fetchFresh } })
  return data.commit.sha
}

// How many files differ between two commits (base older), or null if GitHub
// can't compare them (e.g. history was rewritten). GitHub lists at most 300.
export async function changedFileCount(base, head) {
  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}', { owner, repo, basehead: `${base}...${head}` })
    return data.files?.length ?? null
  } catch (e) {
    if (isNetworkError(e)) throw e
    return null
  }
}

// How `head` stands to `base` on GitHub: 'ahead' | 'identical' | 'behind' (an older commit) | 'diverged', or null when
// GitHub can't compare them (e.g. history was rewritten). Fresh: the answer decides whether a fetched state is stale
export async function compareCommits(base, head) {
  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}', { owner, repo, basehead: `${base}...${head}`, per_page: 1, request: { fetch: fetchFresh } })
    return data.status ?? null
  } catch (e) {
    if (isNetworkError(e)) throw e
    return null
  }
}

// Up to `count` commits of `branch`, newest first, from `from` (a sha: that one first) or the branch's latest:
// [{ sha, date }]. With `path`, only the commits that changed that path (a file's versions)
export async function listCommits(branch, count, from, path) {
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits', { owner, repo, sha: from ?? branch, per_page: count, ...(path ? { path } : {}), request: { fetch: fetchFresh } })
  return data.map(c => ({ sha: c.sha, date: c.commit.committer?.date ?? c.commit.author?.date }))
}

// The files a commit changed: [{ path, status ('added' | 'modified' | 'removed' | 'renamed' | …), from (a rename's old path),
// sha (the file's blob after the commit; none when removed) }], kept in the offline cache once asked for (a commit never
// changes; lists cached before `sha` was kept have none)
export async function commitFiles(sha) {
  const cached = await cache.getCommitFiles(sha)
  if (cached) return cached
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', { owner, repo, ref: sha })
  const files = (data.files ?? []).map(f => ({ path: f.filename, status: f.status, ...(f.previous_filename ? { from: f.previous_filename } : {}), ...(f.status !== 'removed' && f.sha ? { sha: f.sha } : {}) }))
  cache.setCommitFiles(sha, files)
  return files
}

const AT_ONCE = 5 // commits whose files are asked for together

// A page of up to `count` commits of `branch` (with `path`, only those that changed it), newest first, from the latest
// or the ones before `after` (a sha, itself left out), each with its files (`commitFiles`, a few at a time):
// { page: [{ commit, files }], more (whether older ones are there) }. Recent updates and Version history page this way.
export async function commitPage(branch, count, after, path) {
  const fetched = (await listCommits(branch, count + (after ? 2 : 1), after, path)).filter(c => c.sha !== after)
  const commits = fetched.slice(0, count)
  const page = []
  for (let i = 0; i < commits.length; i += AT_ONCE) {
    page.push(...await Promise.all(commits.slice(i, i + AT_ONCE).map(async commit => ({ commit, files: await commitFiles(commit.sha) }))))
  }
  return { page, more: fetched.length > count }
}

// The commit `sha` came after (its first parent), or null for the first commit
export async function commitParent(sha) {
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/git/commits/{commit_sha}', { owner, repo, commit_sha: sha })
  return data.parents[0]?.sha ?? null
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
  const { data } = await step('read', octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', { owner, repo, branch: branchName, request: { fetch: fetchFresh } }))
  const treeSha = data.commit.commit.tree.sha
  const { data: tree } = await step('read', octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', { owner, repo, tree_sha: treeSha, recursive: 'true' }))
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
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', { owner, repo, file_sha: sha })
  const base64 = data.content.replace(/\n/g, '')
  await cache.setBlob(sha, base64)
  return base64
}

export async function getBlob(sha) {
  return decode(await getBlobBase64(sha))
}

// The blob sha and mode of the file at `path` on `ref` (a branch or a commit), or null when there's none there: for a
// file a tree listing left out (GitHub cuts a very large repo's listing short), and a file in an older commit. Read from
// its folder's git tree ("ref:folder"), which has the file's own mode and blob, a symlink's too (the contents API answers
// with the file a symlink points to)
export async function fileOn(path, ref) {
  const slash = path.lastIndexOf('/')
  const name = path.slice(slash + 1)
  const encode = p => p.split('/').map(encodeURIComponent).join('/')
  const treeRef = slash === -1 ? encode(ref) : `${encode(ref)}:${encode(path.slice(0, slash))}`
  try {
    const { data } = await step('read', octokit.request('GET /repos/{owner}/{repo}/git/trees/{+tree_sha}', { owner, repo, tree_sha: treeRef, request: { fetch: fetchFresh } }))
    const item = data.tree.find(i => i.path === name && i.type === 'blob')
    return item ? { sha: item.sha, mode: item.mode } : null
  } catch (e) {
    if (e?.status === 404 || e?.status === 422) return null // no such folder there
    throw e
  }
}

// Whether a sync's commit lost the race: another device moved the branch on between the pull and the push
// (GitHub refuses to move it back), so pulling again and pushing on top works
export const isOutOfDate = e => e?.step === 'save' && (e.status === 409 || e.status === 422)

// Creates one commit on top of `remote` with the given tree entries.
// Returns the new commit's and tree's shas.
export async function commitTree(remote, entries, message) {
  const { data: tree } = await step('upload', octokit.request('POST /repos/{owner}/{repo}/git/trees', {
    owner, repo, base_tree: remote.treeSha, tree: entries,
  }))
  const { data: commit } = await step('upload', octokit.request('POST /repos/{owner}/{repo}/git/commits', {
    owner, repo, message, tree: tree.sha, parents: [remote.commitSha],
  }))
  await step('save', octokit.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', { owner, repo, ref: `heads/${remote.branch}`, sha: commit.sha }))
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
  await step('upload', octokit.request('POST /repos/{owner}/{repo}/git/blobs', { owner, repo, content: base64, encoding: 'base64' }))
}
