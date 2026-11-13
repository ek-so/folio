// @vitest-environment jsdom
// The sync flow end to end, through the real useRepo, against a GitHub faked in memory (lib/github.js) and no offline
// cache: pull, merge what changed on both sides, push; another device pushing in between; going offline.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { setEdit } from '../lib/changes.js'

const server = vi.hoisted(() => ({ tree: null, blobs: {}, commits: [], refuse: 0, offline: false }))

vi.mock('../lib/cache.js', () => ({
  cache: { getTree: async () => undefined, setTree: async () => {}, getBlob: async () => undefined, setBlob: async () => {}, deleteBlob: async () => {}, hasBlob: async () => false },
}))

vi.mock('../lib/github.js', async importActual => {
  const actual = await importActual()
  const offline = () => { if (server.offline) throw Object.assign(new Error('Failed to fetch'), { name: 'HttpError' }) }
  return {
    ...actual,
    getTree: async () => { offline(); return structuredClone(server.tree) },
    getBlob: async sha => { offline(); return server.blobs[sha] },
    getBlobBase64: async sha => btoa(server.blobs[sha] ?? ''),
    getLatestCommitSha: async () => { offline(); return server.tree.commitSha },
    changedFileCount: async () => 1,
    uploadBlob: async () => {},
    fileOn: async path => server.tree.files[path] ?? null,
    commitTree: async (latest, entries, message) => {
      offline()
      if (latest.commitSha !== server.tree.commitSha || server.refuse > 0) {
        server.refuse = Math.max(0, server.refuse - 1)
        throw Object.assign(new Error('Update is not a fast forward'), { status: 422, step: 'save' })
      }
      const n = server.commits.length + 2
      const files = { ...server.tree.files }
      for (const e of entries) {
        if (e.sha === null) { delete files[e.path]; continue }
        const sha = e.content !== undefined ? await actual.blobSha(e.content) : e.sha
        if (e.content !== undefined) server.blobs[sha] = e.content
        files[e.path] = { sha, mode: e.mode }
      }
      server.commits.push({ entries, message })
      server.tree = { ...server.tree, commitSha: `c${n}`, treeSha: `t${n}`, files }
      return { commitSha: `c${n}`, treeSha: `t${n}` }
    },
  }
})

const { useRepo } = await import('./useRepo.js')

// GitHub's note `a.md` with `text`, as one more commit
function onGitHub(text, sha) {
  server.blobs[sha] = text
  const n = server.commits.length + 100
  server.tree = { ...server.tree, commitSha: `remote${n}`, treeSha: `rt${n}`, files: { ...server.tree.files, 'a.md': { sha, mode: '100644' } } }
}

async function opened() {
  const hook = renderHook(() => useRepo('me/notes', () => {}))
  await waitFor(() => expect(hook.result.current.remote).not.toBeNull())
  return hook
}

// This device's edit of `a.md` to `text`
function edit({ result }, text) {
  act(() => result.current.update(ch => setEdit(ch, result.current.virtual['a.md'], text, server.blobs[result.current.virtual['a.md'].sha])))
}

beforeEach(() => {
  localStorage.clear()
  server.blobs = { a1: 'one\ntwo\nthree\n' }
  server.tree = { branch: 'main', commitSha: 'c1', treeSha: 't1', truncated: false, files: { 'a.md': { sha: 'a1', mode: '100644' } } }
  server.commits = []
  server.refuse = 0
  server.offline = false
})

describe('sync', () => {
  it('pushes this device\'s changes', async () => {
    const hook = await opened()
    edit(hook, 'one\nTWO\nthree\n')
    await act(() => hook.result.current.sync(true))
    expect(server.commits).toHaveLength(1)
    expect(server.blobs[server.tree.files['a.md'].sha]).toBe('one\nTWO\nthree\n')
    expect(hook.result.current.changeCount).toBe(0)
  })

  it('merges what changed on GitHub meanwhile, keeping both', async () => {
    const hook = await opened()
    edit(hook, 'one\nmine\nthree\n')
    onGitHub('one\ntheirs\nthree\nfour\n', 'a2')
    await act(() => hook.result.current.sync(true))
    expect(server.blobs[server.tree.files['a.md'].sha]).toBe('one\nmine\ntheirs\nthree\nfour\n')
    expect(hook.result.current.changeCount).toBe(0)
  })

  it('pulls, merges and pushes again when another device pushed first', async () => {
    const hook = await opened()
    edit(hook, 'one\nTWO\nthree\n')
    server.refuse = 1
    let result
    await act(async () => { result = await hook.result.current.sync(true) })
    expect(result).toBe(true)
    expect(server.commits).toHaveLength(1)
    expect(hook.result.current.syncError).toBeNull()
  })

  it('keeps the changes and opens no error when offline', async () => {
    const hook = await opened()
    edit(hook, 'one\nTWO\nthree\n')
    server.offline = true
    await act(() => hook.result.current.sync(true))
    expect(server.commits).toHaveLength(0)
    expect(hook.result.current.changeCount).toBe(1)
    expect(hook.result.current.online).toBe(false)
    expect(hook.result.current.syncError).toBeNull()
  })
})
