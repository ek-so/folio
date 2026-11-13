import { describe, it, expect } from 'vitest'
import { contained } from './sanitize.js'

describe('sanitize', () => {
  it('keeps a note\'s styles inside the note', () => {
    expect(contained('color: red; position: fixed; inset: 0; z-index: 99')).toBe('color: red')
    expect(contained('font-weight:bold;TOP:0;left: 10px;transform: scale(9)')).toBe('font-weight:bold')
    expect(contained('background: url(x); inset-inline-start: 0')).toBe('background: url(x)')
  })
})
