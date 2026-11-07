import { describe, it, expect } from 'vitest'
import { markedDone, staleArchived } from './archive.js'

describe('archive', () => {
  it('marks a note done on a day', () => {
    expect(markedDone('---\nstatus: todo\n---\n# T\n', { year: 2026, month: 11, day: 7 })).toBe('---\nstatus: done\narchived: 7 Nov 2026\n---\n# T\n')
  })

  it('finds archived notes older than 30 days', () => {
    const notes = {
      '.archive/old.md': '---\narchived: 7 Oct 2026\n---\n',
      '.archive/new.md': '---\narchived: 8 Oct 2026\n---\n',
      '.archive/undated.md': '# no date\n',
      'life/old.md': '---\narchived: 1 Jan 2020\n---\n',
    }
    expect(staleArchived(notes, { year: 2026, month: 11, day: 7 })).toEqual(['.archive/old.md'])
  })
})
