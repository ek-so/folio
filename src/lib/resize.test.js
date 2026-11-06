import { describe, it, expect } from 'vitest'
import { clampSize, TREE_WIDTH } from './resize.js'

describe('clampSize', () => {
  it('keeps the width within limits', () => {
    expect(clampSize(100, TREE_WIDTH)).toBe(200)
    expect(clampSize(900, TREE_WIDTH)).toBe(480)
    expect(clampSize('300', TREE_WIDTH)).toBe(300)
  })
  it('falls back to the default when nothing valid is saved', () => {
    expect(clampSize(null, TREE_WIDTH)).toBe(300)
    expect(clampSize('abc', TREE_WIDTH)).toBe(300)
  })
})
