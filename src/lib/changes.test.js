import { describe, it, expect } from 'vitest'
import {
  empty, count, virtualFiles, add, setEdit, rename, remove, conflicts, settle, treeEntries, filesAfter,
  upload, replaceUpload, normalize, freePath,
  renameTarget, renameError, createError, getAllFolders, nameError,
} from './changes.js'

const files = {
  'a.md': { sha: 'a1', mode: '100644' },
  'dir/x.md': { sha: 'x1', mode: '100644' },
}
const view = ch => virtualFiles(files, ch)

describe('changes', () => {
  it('only counts real edits', () => {
    let ch = setEdit(empty(), view(empty())['a.md'], 'same', 'same')
    expect(count(ch)).toBe(0)
    ch = setEdit(ch, view(ch)['a.md'], 'new', 'old')
    expect(count(ch)).toBe(1)
    ch = setEdit(ch, view(ch)['a.md'], 'old', 'old')
    expect(count(ch)).toBe(0)
  })

  it('renames a folder and back', () => {
    let ch = rename(empty(), view(empty()), 'dir', 'other', true)
    expect(Object.keys(view(ch))).toContain('other/x.md')
    ch = rename(ch, view(ch), 'other', 'dir', true)
    expect(count(ch)).toBe(0)
  })

  it('creates files locally and forgets them when deleted', () => {
    let ch = add(empty(), files, 'new.md', '# new')
    expect(view(ch)['new.md']).toMatchObject({ sha: null })
    ch = setEdit(ch, view(ch)['new.md'], '', '')
    expect(count(ch)).toBe(1) // a new file stays even when emptied
    ch = remove(ch, view(ch), 'new.md', false)
    expect(count(ch)).toBe(0)
  })

  it('flags conflicts, including a new file whose path appeared on GitHub', () => {
    let ch = setEdit(empty(), view(empty())['a.md'], 'mine', 'old')
    ch = add(ch, files, 'b.md', 'b')
    expect(conflicts(ch, files)).toEqual([])
    const remote = { ...files, 'a.md': { sha: 'a2' }, 'b.md': { sha: 'b1' } }
    expect(conflicts(ch, remote).sort()).toEqual(['a.md', 'b.md'])
  })

  it('builds tree entries for edit, move and delete', () => {
    let ch = setEdit(empty(), view(empty())['a.md'], 'text', 'old')
    ch = rename(ch, view(ch), 'a.md', 'b.md', false)
    ch = remove(ch, view(ch), 'dir/x.md', false)
    expect(treeEntries(ch, files)).toEqual([
      { path: 'a.md', mode: '100644', type: 'blob', sha: null },
      { path: 'b.md', mode: '100644', type: 'blob', content: 'text' },
      { path: 'dir/x.md', mode: '100644', type: 'blob', sha: null },
    ])
  })

  it('works out GitHub\'s files after a commit, with nothing left to sync', () => {
    let ch = setEdit(empty(), view(empty())['a.md'], 'text', 'old')
    ch = rename(ch, view(ch), 'a.md', 'b.md', false)
    ch = remove(ch, view(ch), 'dir/x.md', false)
    const after = filesAfter(files, ch, { 'a.md': 'b2' })
    expect(after).toEqual({ 'b.md': { sha: 'b2', mode: '100644' } })
    expect(count(settle(ch, ch, after))).toBe(0)
    expect(conflicts(settle(ch, ch, after), after)).toEqual([])
  })

  it('adds and replaces files from the device until they are synced', () => {
    let ch = upload(empty(), files, 'dir/photo.png', 'p1')
    ch = replaceUpload(ch, view(ch)['a.md'], 'a9')
    expect(view(ch)['dir/photo.png']).toMatchObject({ sha: 'p1' })
    expect(view(ch)['a.md']).toMatchObject({ sha: 'a9' })
    expect(count(ch)).toBe(2)
    expect(treeEntries(ch, files)).toEqual([
      { path: 'dir/photo.png', mode: '100644', type: 'blob', sha: 'p1' },
      { path: 'a.md', mode: '100644', type: 'blob', sha: 'a9' },
    ])
    const after = filesAfter(files, ch, {})
    expect(after['dir/photo.png'].sha).toBe('p1')
    expect(count(settle(ch, ch, after))).toBe(0)
    expect(count(remove(ch, view(ch), 'dir/photo.png', false))).toBe(1)
  })

  it('numbers a name that is taken', () => {
    let ch = upload(empty(), files, 'dir/x 2.md', 'n1')
    expect(freePath(ch, view(ch), 'dir/x.md')).toBe('dir/x 3.md')
    expect(freePath(ch, view(ch), 'new.png')).toBe('new.png')
  })

  it('reads changes saved before uploads existed', () => {
    expect(normalize({ edits: {}, moves: {}, base: {} })).toEqual(empty())
    expect(normalize(null)).toEqual(empty())
  })

  it('settle keeps edits made while a commit was in flight', () => {
    const committed = setEdit(empty(), view(empty())['a.md'], 'v1', 'old')
    const current = setEdit(committed, virtualFiles(files, committed)['a.md'], 'v2', 'old')
    const after = { ...files, 'a.md': { sha: 'a-v1' } }
    const next = settle(current, committed, after)
    expect(next.edits).toEqual({ 'a.md': 'v2' })
    expect(next.base).toEqual({ 'a.md': 'a-v1' })
    expect(count(settle(committed, committed, after))).toBe(0)
  })

  it('settle re-keys a renamed file to its new path', () => {
    const committed = rename(empty(), view(empty()), 'a.md', 'b.md', false)
    const current = setEdit(committed, virtualFiles(files, committed)['b.md'], 'edited', 'old')
    const after = { 'b.md': { sha: 'b1' }, 'dir/x.md': files['dir/x.md'] }
    const next = settle(current, committed, after)
    expect(next).toEqual({ edits: { 'b.md': 'edited' }, uploads: {}, moves: {}, base: { 'b.md': 'b1' } })
  })
})

describe('name checks', () => {
  it('allows names starting with a dot, like GitHub', () => {
    expect(nameError('.assets')).toBe(null)
    expect(nameError('..')).not.toBe(null)
    expect(nameError('.gitkeep')).not.toBe(null)
  })

  const item = (path, type = 'file') => ({ name: path.split('/').pop(), path, type })

  it('keeps the extension and refuses taken names', () => {
    expect(renameTarget(item('dir/x.md'), 'y')).toBe('dir/y.md')
    expect(renameError(empty(), view(empty()), item('a.md'), 'dir')).toMatch(/taken/)
  })

  it('refuses a path freed by an unsynced rename, except a new file where one was deleted', () => {
    let ch = rename(empty(), view(empty()), 'a.md', 'b.md', false)
    expect(createError(ch, view(ch), ['a.md'])).toMatch(/Sync first/)
    expect(renameError(ch, view(ch), item('dir/x.md'), 'a.md')).toMatch(/Sync first/)
    // renaming b.md back to its own original name is fine
    expect(renameError(ch, view(ch), item('b.md'), 'a.md')).toBeNull()
    ch = remove(empty(), view(empty()), 'a.md', false)
    expect(createError(ch, view(ch), ['a.md'])).toBeNull()
    expect(renameError(ch, view(ch), item('dir/x.md'), 'a.md')).toMatch(/Sync first/)
  })
})

describe('getAllFolders', () => {
  it('lists every folder level, sorted', () => {
    expect(getAllFolders({ 'a.md': {}, 'x/y/z.md': {}, 'x/w.md': {} })).toEqual(['x', 'x/y'])
  })
})
