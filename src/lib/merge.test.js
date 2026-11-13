import { describe, it, expect } from 'vitest'
import { mergeText, mergeLines, resolveConflicts } from './merge.js'
import { conflicts, virtualFiles } from './changes.js'

describe('merge', () => {
  it('takes changes made on one side, and keeps both where both changed the same lines', () => {
    const base = 'a\nb\nc\nd\n'
    expect(mergeText(base, 'a\nB\nc\nd\n', 'a\nb\nc\nD\n')).toEqual({ text: 'a\nB\nc\nD\n', clashed: false })
    expect(mergeText(base, 'a\nmine\nc\nd\n', 'a\ntheirs\nc\nd\n')).toEqual({ text: 'a\nmine\ntheirs\nc\nd\n', clashed: true })
    expect(mergeText(base, 'a\nc\nd\n', 'a\nb2\nc\nd\n').text).toBe('a\nb2\nc\nd\n') // removed here, changed there: kept
    expect(mergeText(base, 'a\nc\nd\n', 'a\nb\nc\nd\nnew\n').text).toBe('a\nc\nd\nnew\n') // a removal and an addition
    expect(mergeText('', 'mine\n', 'theirs\n').text).toBe('mine\ntheirs\n') // made on both sides
    expect(mergeLines(['x'], ['x', 'y'], ['x', 'y'])).toEqual(['x', 'y']) // the same change once
  })

  it('keeps a note\'s properties valid: a clash keeps this device\'s value, GitHub\'s goes under them', () => {
    const base = '---\nstatus: todo\ntags: a\n---\n# T\nbody\n'
    const local = '---\nstatus: doing\ntags: a\n---\n# T\nbody\nmine\n'
    const remote = '---\nstatus: done\ntags: b\n---\n# T\nbody\n'
    expect(mergeText(base, local, remote).text).toBe('---\nstatus: doing\ntags: b\n---\nstatus: done\n# T\nbody\nmine\n') // tags changed on GitHub only
    const one = mergeText(base, '---\nstatus: doing\ntags: a\n---\n# T\nbody\n', '---\nstatus: todo\ntags: b\n---\n# T\nbody\n').text
    expect(one).toBe('---\nstatus: doing\ntags: b\n---\n# T\nbody\n') // different properties: both taken
  })

  it('resolves every kind of conflict, losing nothing', () => {
    const files = { 'a.md': { sha: 'a2' }, 'pic.png': { sha: 'p2' }, 'moved.md': { sha: 'm2' }, 'removed.md': { sha: 'r2' }, 'new.md': { sha: 'n1' } }
    const ch = {
      edits: { 'a.md': 'x\nmine\n', 'gone.md': 'kept\n', 'new.md': 'mine\n' },
      uploads: { 'pic.png': 'local' },
      moves: { 'moved.md': 'Folder/moved.md', 'removed.md': null },
      base: { 'a.md': 'a1', 'pic.png': 'p1', 'moved.md': 'm1', 'removed.md': 'r1', 'gone.md': 'g1', 'new.md': null },
    }
    const origs = conflicts(ch, files)
    const texts = { 'a.md': { base: 'x\ny\n', remote: 'x\ntheirs\n' }, 'new.md': { base: '', remote: 'theirs\n' } }
    const { changes, merged } = resolveConflicts(ch, files, origs, texts)
    expect(conflicts(changes, files)).toEqual([])
    expect(changes.edits['a.md']).toBe('x\nmine\ntheirs\n')
    expect(changes.edits['new.md']).toBe('mine\ntheirs\n')
    expect(changes.edits['gone.md']).toBe('kept\n') // removed on GitHub, edited here: made anew
    expect(changes.base['gone.md']).toBeNull()
    expect('removed.md' in changes.base).toBe(false) // removed here, changed on GitHub: GitHub's stays
    const shown = virtualFiles(files, changes)
    expect(shown['Folder/moved.md'].sha).toBe('m2') // moved here: GitHub's content at the new place
    expect(shown['pic.png'].sha).toBe('p2') // GitHub's keeps the name…
    expect(shown['pic (this device).png'].sha).toBe('local') // …this device's goes beside it
    expect(merged.sort()).toEqual(['a.md', 'new.md', 'pic.png'])
  })
})
