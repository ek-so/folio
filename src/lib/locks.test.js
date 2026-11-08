import { describe, it, expect } from 'vitest'
import { parseLocks, serializeLocks, toggledLock, movedLocks, removedLocks } from './locks.js'

describe('locks', () => {
  it('reads its file, none, or nothing from bad text', () => {
    expect(parseLocks(undefined)).toEqual([])
    expect(parseLocks('nope')).toBeNull()
    expect(parseLocks('{"paths":"a.md"}')).toBeNull()
    expect(parseLocks('{"paths":["b.md","a.md","",3,"a.md"]}')).toEqual(['b.md', 'a.md'])
    expect(parseLocks(serializeLocks(['b.md', 'a.md']))).toEqual(['a.md', 'b.md'])
  })

  it('locks, unlocks, follows moves and forgets deletes', () => {
    expect(toggledLock(['a.md'], 'b.md')).toEqual(['a.md', 'b.md'])
    expect(toggledLock(['a.md', 'b.md'], 'a.md')).toEqual(['b.md'])
    expect(movedLocks(['Life/a.md', 'Life b.md', 'x.md'], 'Life', 'Home', true)).toEqual(['Home/a.md', 'Life b.md', 'x.md'])
    expect(movedLocks(['x.md', 'x.md2'], 'x.md', 'y.md', false)).toEqual(['y.md', 'x.md2'])
    expect(removedLocks(['Life/a.md', 'Lifestyle/b.md'], 'Life', true)).toEqual(['Lifestyle/b.md'])
  })
})
