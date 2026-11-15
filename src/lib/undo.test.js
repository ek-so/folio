import { describe, it, expect } from 'vitest'
import { startHistory, recorded, undone, redone, changedAt } from './undo.js'

describe('undo history', () => {
  it('makes one step of a burst of typing', () => {
    let h = startHistory('a')
    h = recorded(h, 'ab', 1000)
    h = recorded(h, 'abc', 1500)
    h = recorded(h, 'abcd', 4000) // after a pause: a new step
    h = undone(h)
    expect(h.present).toBe('abc')
    h = undone(h)
    expect(h.present).toBe('a')
    expect(undone(h)).toBe(h)
    h = redone(redone(h))
    expect(h.present).toBe('abcd')
    expect(redone(h)).toBe(h)
  })

  it('drops what can be redone once something changes', () => {
    let h = recorded(startHistory('a'), 'ab', 1000)
    h = recorded(undone(h), 'ax', 1100)
    expect(h.future).toEqual([])
    expect(undone(h).present).toBe('a')
  })
  it('puts the cursor at the end of what changed', () => {
    expect(changedAt('hello world', 'hello big world')).toBe(10)
    expect(changedAt('hello big world', 'hello world')).toBe(6)
    expect(changedAt('aaa', 'aaaa')).toBe(4)
  })
})
