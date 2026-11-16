import { describe, it, expect } from 'vitest'
import { reverted, sides } from './revert.js'
import { empty, virtualFiles } from './changes.js'

// GitHub's files now, and the texts of the blobs by sha
const texts = { a1: 'one\ntwo\n', a2: 'one\nTWO\n', a3: 'zero\none\nTWO\n', n1: 'new\n' }
const text = sha => texts[sha]
const files = (entries) => Object.fromEntries(Object.entries(entries).map(([p, sha]) => [p, { sha, mode: '100644' }]))
const at = (ch, remote, path) => {
  const entry = virtualFiles(remote, ch)[path]
  return entry && (ch.edits[entry.orig] ?? entry.sha)
}

describe('undo of an update', () => {
  it('reads a commit\'s file as where it was before and after', () => {
    expect(sides({ path: 'a.md', status: 'added' })).toEqual({ before: null, after: 'a.md' })
    expect(sides({ path: 'a.md', status: 'removed' })).toEqual({ before: 'a.md', after: null })
    expect(sides({ path: 'b.md', status: 'renamed', from: 'a.md' })).toEqual({ before: 'a.md', after: 'b.md' })
  })

  it('puts a changed file back, keeping what changed since', () => {
    const step = { before: { path: 'a.md', sha: 'a1' }, after: { path: 'a.md', sha: 'a2' } }
    const untouched = reverted(empty(), files({ 'a.md': 'a2' }), [step], text)
    expect(at(untouched.changes, files({ 'a.md': 'a2' }), 'a.md')).toBe('one\ntwo\n')
    const since = reverted(empty(), files({ 'a.md': 'a3' }), [step], text) // a line added on top since
    expect(at(since.changes, files({ 'a.md': 'a3' }), 'a.md')).toBe('zero\none\ntwo\n')
  })

  it('removes what it added, unless it changed since, and makes again what it removed', () => {
    const remote = files({ 'n.md': 'n1', 'img.png': 'p2' })
    const added = [{ before: null, after: { path: 'n.md', sha: 'n1' } }]
    expect(at(reverted(empty(), remote, added, text).changes, remote, 'n.md')).toBeUndefined()
    const edited = { ...empty(), edits: { 'n.md': 'mine\n' }, base: { 'n.md': 'n1' } }
    const kept = reverted(edited, remote, added, text)
    expect(at(kept.changes, remote, 'n.md')).toBe('mine\n')
    expect(kept.kept).toEqual(['n.md'])
    const removed = reverted(empty(), remote, [{ before: { path: 'a.md', sha: 'a1' }, after: null }], text)
    expect(at(removed.changes, remote, 'a.md')).toBe('one\ntwo\n')
  })

  it('moves a renamed file back, and keeps an image changed since next to the one from before', () => {
    const remote = files({ 'b.md': 'a1', 'img.png': 'p3' })
    const moved = reverted(empty(), remote, [{ before: { path: 'a.md', sha: 'a1' }, after: { path: 'b.md', sha: 'a1' } }], text)
    expect(Object.keys(virtualFiles(remote, moved.changes)).sort()).toEqual(['a.md', 'img.png'])
    const image = reverted(empty(), remote, [{ before: { path: 'img.png', sha: 'p1' }, after: { path: 'img.png', sha: 'p2' } }], text)
    const view = virtualFiles(remote, image.changes)
    expect([view['img.png'].sha, view['img (before).png'].sha]).toEqual(['p3', 'p1'])
  })

  it('leaves a file gone since as it is, and undoing the undo puts the update back', () => {
    const gone = reverted(empty(), files({}), [{ before: { path: 'a.md', sha: 'a1' }, after: { path: 'a.md', sha: 'a2' } }], text)
    expect(gone.left).toEqual(['a.md'])
    const remote = files({ 'a.md': 'a1' }) // the undo synced
    const redo = reverted(empty(), remote, [{ before: { path: 'a.md', sha: 'a2' }, after: { path: 'a.md', sha: 'a1' } }], text)
    expect(at(redo.changes, remote, 'a.md')).toBe('one\nTWO\n')
  })
})
