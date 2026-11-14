import { describe, it, expect } from 'vitest'
import { folderRows } from './folderTree.js'

describe('folderRows', () => {
  const folders = ['', 'a', 'a/b', 'a/b/c', 'z', 'x/y']
  it('shows top-level folders, children once expanded', () => {
    expect(folderRows(folders, new Set()).map(r => r.path)).toEqual(['a', 'x', 'z'])
    const rows = folderRows(folders, new Set(['a', 'a/b']))
    expect(rows.map(r => [r.path, r.depth])).toEqual([['a', 0], ['a/b', 1], ['a/b/c', 2], ['x', 0], ['z', 0]])
    expect(rows[0]).toMatchObject({ name: 'a', branch: true, open: true })
  })
  it('keeps unlisted parents as rows that can not be picked', () => {
    const rows = folderRows(folders, new Set(['x']))
    expect(rows.find(r => r.path === 'x')).toMatchObject({ pickable: false, branch: true })
    expect(rows.find(r => r.path === 'x/y')).toMatchObject({ pickable: true, branch: false })
  })
})
