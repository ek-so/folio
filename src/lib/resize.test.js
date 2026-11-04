import { describe, it, expect } from 'vitest'
import { clampWidth, TREE_WIDTH } from './resize.js'

describe('clampWidth', () => {
  it('keeps the width within limits', () => {
    expect(clampWidth(100, TREE_WIDTH)).toBe(200)
    expect(clampWidth(900, TREE_WIDTH)).toBe(480)
    expect(clampWidth('300', TREE_WIDTH)).toBe(300)
  })
  it('falls back to the default when nothing valid is saved', () => {
    expect(clampWidth(null, TREE_WIDTH)).toBe(256)
    expect(clampWidth('abc', TREE_WIDTH)).toBe(256)
  })
})
