import { describe, it, expect } from 'vitest'
import { itemsIn } from './files.js'

describe('files', () => {
  it('counts what a folder holds right inside it', () => {
    const files = ['a.md', 'A/b.md', 'A/c.png', 'A/B/d.md'], folders = ['A', 'A/B']
    expect(itemsIn('A', files, folders)).toBe(3)
    expect(itemsIn('', files, folders)).toBe(2)
  })
})
