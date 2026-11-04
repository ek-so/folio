import { describe, it, expect } from 'vitest'
import { foldersToOpen } from './tree.js'

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
