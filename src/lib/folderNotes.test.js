import { describe, it, expect } from 'vitest'
import { withNoteKeys, editNotes } from './folderNotes.js'
import { empty, add } from './changes.js'

describe('folder notes', () => {
  it('gives the notes in a folder the keys they lack', () => {
    const remote = { 'T/a.md': { sha: 's1', mode: '100644' }, 'T/b.png': { sha: 's2', mode: '100644' }, 'U/c.md': { sha: 's3', mode: '100644' } }
    const texts = { s1: '# A\n', s3: '# C\n' }
    const ch = withNoteKeys(add(empty(), remote, 'T/new.md', '---\ndescription: x\n---\n'), remote, 'T', ['description'], sha => sha === null ? '' : texts[sha])
    expect(ch.edits['T/a.md']).toBe('---\ndescription:\n---\n# A\n')
    expect(ch.edits['T/new.md']).toBe('---\ndescription: x\n---\n')
    expect(Object.keys(ch.edits).sort()).toEqual(['T/a.md', 'T/new.md'])
    // and back: an edit that undoes it leaves the note unchanged
    const undone = editNotes(ch, remote, 'T', t => t.replace('---\ndescription:\n---\n', ''), sha => sha === null ? '' : texts[sha])
    expect(Object.keys(undone.edits)).toEqual(['T/new.md'])
  })

  it('edits only its own notes: no symlinks, no technical files', () => {
    const remote = {
      'T/a.md': { sha: 's1', mode: '100644' }, 'T/link.md': { sha: 's2', mode: '120000' },
      'T/_templates/t.md': { sha: 's1', mode: '100644' }, 'T/Todo/.x/n.md': { sha: 's1', mode: '100644' },
    }
    const texts = { s1: '# A\n', s2: '../a.md' }
    const ch = withNoteKeys(empty(), remote, 'T', ['description'], sha => texts[sha])
    expect(Object.keys(ch.edits)).toEqual(['T/a.md'])
    const renamed = editNotes(ch, remote, 'T', t => t.replace('description:', 'summary:'), sha => texts[sha])
    expect(renamed.edits['T/a.md']).toBe('---\nsummary:\n---\n# A\n')
  })
})
