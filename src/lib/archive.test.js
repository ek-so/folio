import { describe, it, expect } from 'vitest'
import { archiveDay, inArchive, markedDone, staleArchiveDays } from './archive.js'
import { empty, remove, virtualFiles } from './changes.js'

describe('archive', () => {
  it('has a folder per day', () => {
    expect(archiveDay({ year: 2026, month: 11, day: 7 })).toBe('.archive/2026-11-07')
    expect(inArchive('.archive/2026-11-07/a.md')).toBe(true)
    expect(inArchive('.archive')).toBe(true)
    expect(inArchive('.archived/a.md')).toBe(false)
  })

  it('marks a note done', () => {
    expect(markedDone('---\nstatus: todo\n---\n# T\n')).toBe('---\nstatus: done\n---\n# T\n')
  })

  it('finds day folders older than 30 days', () => {
    const paths = ['.archive/2026-10-07/a.md', '.archive/2026-10-07/b/c.png', '.archive/2026-10-08/d.md', '.archive/loose.md', 'life/2020-01-01/e.md']
    expect(staleArchiveDays(paths, { year: 2026, month: 11, day: 7 })).toEqual(['.archive/2026-10-07'])
  })

  it('touches nothing but the archive\'s own old day folders', () => {
    const today = { year: 2026, month: 11, day: 7 }
    const lookalikes = [
      'notes/.archive/2020-01-01/a.md', // an .archive that isn't the root one
      '.archive-old/2020-01-01/a.md', // a folder whose name only starts the same
      '.archive/2020-01-01', // a file named like a day, not a folder
      '.archive/2020-01-01x/a.md', // not a day
      '.archive/old/2020-01-01/a.md', // a day deeper inside
      '.archive/2026-12-01/a.md', // a day still to come
      '.archive/2026-10-08/a.md', // exactly 30 days: kept
    ]
    expect(staleArchiveDays(lookalikes, today)).toEqual([])
    // Removing a stale day takes only the files inside it, not a sibling whose name starts the same
    const files = Object.fromEntries(['.archive/2020-01-01/a.md', '.archive/2020-01-01/b/c.md', '.archive/2020-01-011/d.md', 'notes/e.md'].map(p => [p, { sha: p, mode: '100644' }]))
    const ch = staleArchiveDays(Object.keys(files), today).reduce((c, day) => remove(c, virtualFiles(files, c), day, true), empty())
    expect(Object.keys(virtualFiles(files, ch)).sort()).toEqual(['.archive/2020-01-011/d.md', 'notes/e.md'])
  })
})
