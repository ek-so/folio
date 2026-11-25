import { describe, it, expect } from 'vitest'
import { isStale } from './treeOrder.js'

describe('isStale', () => {
  it('is true only for a commit behind the held one', () => {
    expect(isStale('behind')).toBe(true)
    for (const s of ['ahead', 'identical', 'diverged', null, undefined]) expect(isStale(s)).toBe(false)
  })
})
