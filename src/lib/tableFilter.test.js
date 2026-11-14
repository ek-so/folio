import { describe, it, expect } from 'vitest'
import { repeatedWords, rowShown } from './tableFilter.js'

describe('table filter', () => {
  it('offers the words used in more than one row, most used first', () => {
    const cells = ['Work, urgent', 'home', 'work', 'Home office', 'work · a', 'a']
    expect(repeatedWords(cells)).toEqual([
      { key: 'work', label: 'Work', count: 3 },
      { key: 'home', label: 'home', count: 2 },
    ])
  })

  it('counts a word once per row', () => {
    expect(repeatedWords(['go go', 'stop'])).toEqual([])
  })

  it('shows rows having a ticked word in every filtered column', () => {
    const filter = { 0: ['work', 'home'], 1: ['done'] }
    expect(rowShown(['Work stuff', 'Done'], filter)).toBe(true)
    expect(rowShown(['home', 'todo'], filter)).toBe(false)
    expect(rowShown(['garden', 'done'], filter)).toBe(false)
    expect(rowShown(['garden', 'todo'], { 0: [] })).toBe(true)
  })
})
