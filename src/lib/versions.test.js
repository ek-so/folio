import { describe, it, expect } from 'vitest'
import { versionOf, versionsIn, diffNote } from './versions.js'

const commit = sha => ({ sha, date: '2026-01-01T00:00:00Z' })

describe('versionOf', () => {
  it('reads how the commit changed the note', () => {
    expect(versionOf(commit('c'), [{ path: 'a.md', status: 'modified', sha: 'b1' }], 'a.md'))
      .toEqual({ sha: 'c', date: '2026-01-01T00:00:00Z', path: 'a.md', status: 'modified', blob: 'b1' })
    expect(versionOf(commit('c'), [{ path: 'a.md', status: 'renamed', from: 'old.md' }], 'a.md'))
      .toMatchObject({ status: 'renamed', from: 'old.md' })
  })
  it('is null when the commit removed it', () => {
    expect(versionOf(commit('c'), [{ path: 'a.md', status: 'removed' }], 'a.md')).toBeNull()
  })
})

describe('versionsIn', () => {
  const page = list => list.map(([sha, files]) => ({ commit: commit(sha), files }))
  it('goes on with the same path while there are more', () => {
    const r = versionsIn(page([['c2', [{ path: 'a.md', status: 'modified' }]], ['c1', [{ path: 'a.md', status: 'modified' }]]]), 'a.md', true)
    expect(r.versions.map(v => v.sha)).toEqual(['c2', 'c1'])
    expect(r.next).toEqual({ path: 'a.md', from: 'c1', skip: 'c1' })
  })
  it('follows a rename to the old path and stops where the note was added', () => {
    const renamed = versionsIn(page([['c2', [{ path: 'a.md', status: 'renamed', from: 'b.md' }]], ['c1', [{ path: 'a.md', status: 'added' }]]]), 'a.md', true)
    expect(renamed.versions.map(v => v.sha)).toEqual(['c2'])
    expect(renamed.next).toEqual({ path: 'b.md', from: 'c2', skip: 'c2' })
    expect(versionsIn(page([['c1', [{ path: 'b.md', status: 'added' }]]]), 'b.md', true).next).toBeNull()
  })
  it('stops at a commit that removed what was at the path before', () => {
    const r = versionsIn(page([['c2', [{ path: 'a.md', status: 'modified' }]], ['c1', [{ path: 'a.md', status: 'removed' }]]]), 'a.md', true)
    expect(r.versions.map(v => v.sha)).toEqual(['c2'])
    expect(r.next).toBeNull()
  })
})

describe('diffNote', () => {
  const kinds = d => Object.entries(d.marks).map(([at, kind]) => [d.text.slice(Number(at)).split('\n')[0], kind])
  it('marks added and removed blocks, keeping the rest', () => {
    const d = diffNote('# Title\n\nOld line\n\nSame\n', '# Title\n\nNew line\n\nSame\n\nAdded\n')
    expect(kinds(d)).toEqual([['Old line', 'removed'], ['New line', 'added'], ['Added', 'added']])
    expect(d.text).toContain('# Title')
    expect(d.text).toContain('Same')
  })
  it('keeps blocks of different kinds apart', () => {
    expect(diffNote('- a\n', '- b\n').text).toBe('- a\n\n<!-- -->\n\n- b')
  })
  it('has nothing marked when nothing changed, and lists the properties that did', () => {
    const d = diffNote('---\nstatus: todo\n---\nText\n', '---\nstatus: done\ntag: x\n---\nText\n')
    expect(d.marks).toEqual({})
    expect(d.text.startsWith('---\nstatus: done\ntag: x\n---\n')).toBe(true)
    expect(d.props).toEqual(['status', 'tag'])
  })
  it('marks everything added for the first version', () => {
    expect(Object.values(diffNote('', 'One\n\nTwo\n').marks)).toEqual(['added', 'added'])
  })
})
