import { describe, it, expect } from 'vitest'
import { searchNotes } from './search.js'

describe('searchNotes', () => {
  const texts = { 'b.md': 'Buy milk\nand eggs', 'a.md': 'Plan the trip to MILAN next spring', 'c.md': 'nothing' }

  it('finds notes by their text, in path order, with a snippet around the match', () => {
    const hits = searchNotes(texts, 'mil')
    expect(hits.map(h => h.path)).toEqual(['a.md', 'b.md'])
    expect(hits[1]).toEqual({ path: 'b.md', before: 'Buy ', match: 'mil', after: 'k and eggs' })
    expect(hits[0].match).toBe('MIL')
  })

  it('cuts long text with …, skips notes and short or empty queries', () => {
    const long = { 'x.md': `${'a '.repeat(40)}needle${' z'.repeat(60)}` }
    const [hit] = searchNotes(long, 'needle')
    expect(hit.before.startsWith('…')).toBe(true)
    expect(hit.after.endsWith('…')).toBe(true)
    expect(searchNotes(texts, 'mil', p => p === 'a.md').map(h => h.path)).toEqual(['b.md'])
    expect(searchNotes(texts, 'm')).toEqual([])
    expect(searchNotes(texts, '  ')).toEqual([])
    expect(searchNotes(texts, 'mil', () => false, 1)).toHaveLength(1)
  })
})
