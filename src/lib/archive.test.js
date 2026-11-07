import { describe, it, expect } from 'vitest'
import { archiveDay, inArchive, markedDone, staleArchiveDays } from './archive.js'

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
})
