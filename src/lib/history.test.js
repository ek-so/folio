import { describe, it, expect } from 'vitest'
import { commitEntry, unsyncedFiles, mergedHistory, shownCommits, whenLabel } from './history.js'

describe('recent updates', () => {
  it('lists a commit\'s files without the app\'s settings, marking this device\'s', () => {
    const files = [{ path: 'a.md', status: 'modified' }, { path: '.folio/views.json', status: 'modified' }, { path: 'New/.gitkeep', status: 'added' }]
    expect(commitEntry({ sha: 's', date: 'd' }, files, ['s'])).toEqual({
      sha: 's', date: 'd', mine: true,
      files: [{ path: 'a.md', status: 'modified' }, { path: 'New', status: 'added', folder: true }],
    })
  })

  it('shows a file moved to the archive as archived', () => {
    expect(commitEntry({ sha: 's' }, [{ path: '.archive/2026-11-15/a.md', status: 'renamed', from: 'Notes/a.md' }], []).files)
      .toEqual([{ path: 'Notes/a.md', status: 'archived' }])
  })

  it('lists the changes not synced yet', () => {
    const ch = { edits: { 'a.md': 'x' }, uploads: {}, moves: { 'b.md': 'c.md', 'd.md': null }, base: { 'a.md': '1', 'b.md': '2', 'd.md': '3', 'n.md': null, '.folio/x.json': '4' } }
    expect(unsyncedFiles(ch)).toEqual([
      { path: 'a.md', status: 'modified' }, { path: 'c.md', status: 'renamed', from: 'b.md' }, { path: 'd.md', status: 'removed' }, { path: 'n.md', status: 'added' },
    ])
  })

  it('puts a newer page on top of what was loaded', () => {
    const c = sha => ({ sha })
    expect(mergedHistory([c('n'), c('a')], [c('a'), c('b')])).toEqual([c('n'), c('a'), c('b')])
    expect(mergedHistory([c('n'), c('m')], [c('a'), c('b')])).toEqual([c('n'), c('m')])
    expect(mergedHistory([], [c('a')])).toEqual([c('a')])
  })

  it('says when each update was made, leaving out those with nothing to show', () => {
    const now = new Date(2026, 10, 15, 12)
    expect(whenLabel(new Date(2026, 10, 15, 9, 5).toISOString(), now)).toBe('Today, 09:05')
    expect(whenLabel(new Date(2026, 5, 13, 14, 39).toISOString(), now)).toBe('Jun 13, 14:39')
    expect(whenLabel(new Date(2025, 0, 2, 8, 0).toISOString(), now)).toBe('Jan 2 2025, 08:00')
    expect(shownCommits([{ sha: '1', files: [{}] }, { sha: '2', files: [] }]).map(c => c.sha)).toEqual(['1'])
  })
})
