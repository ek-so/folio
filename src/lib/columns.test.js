import { describe, it, expect } from 'vitest'
import { columnFolders } from './columns.js'

describe('columnFolders', () => {
  it('ends with the open folder, after its parents', () => {
    expect(columnFolders('a/b/c')).toEqual(['a', 'a/b', 'a/b/c'])
    expect(columnFolders('a/b')).toEqual(['', 'a', 'a/b'])
  })
  it('leaves the columns after a folder near the root empty', () => {
    expect(columnFolders('')).toEqual(['', null, null])
    expect(columnFolders('a')).toEqual(['', 'a', null])
  })
})
