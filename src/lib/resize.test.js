import { describe, it, expect } from 'vitest'
import { clampSize, RAIL_WIDTH } from './resize.js'

describe('clampSize', () => {
  it('keeps the width within limits', () => {
    expect(clampSize(100, RAIL_WIDTH)).toBe(160)
    expect(clampSize(900, RAIL_WIDTH)).toBe(320)
    expect(clampSize('300', RAIL_WIDTH)).toBe(300)
  })
  it('falls back to the default when nothing valid is saved', () => {
    expect(clampSize(null, RAIL_WIDTH)).toBe(240)
    expect(clampSize('abc', RAIL_WIDTH)).toBe(240)
  })
})
