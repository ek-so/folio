import { describe, it, expect } from 'vitest'
import { foldersToOpen, clampTreeWidth } from './tree.js'

describe('foldersToOpen', () => {
  it('opens the parents of a file', () => {
    expect(foldersToOpen('a/b/c.md', false)).toEqual(['a', 'a/b'])
    expect(foldersToOpen('c.md', false)).toEqual([])
  })
  it('opens a folder too', () => {
    expect(foldersToOpen('a/b', true)).toEqual(['a', 'a/b'])
    expect(foldersToOpen('', true)).toEqual([])
  })
})

describe('clampTreeWidth', () => {
  it('keeps the width within limits', () => {
    expect(clampTreeWidth(100)).toBe(200)
    expect(clampTreeWidth(900)).toBe(480)
    expect(clampTreeWidth('300')).toBe(300)
  })
  it('falls back to the default when nothing valid is saved', () => {
    expect(clampTreeWidth(null)).toBe(256)
    expect(clampTreeWidth('abc')).toBe(256)
  })
})
