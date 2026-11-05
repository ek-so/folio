import { describe, it, expect } from 'vitest'
import { parseTagColors, serializeTagColors, withTagColor } from './tagColors.js'

describe('tagColors', () => {
  it('has none without a file, and nothing from text it can\'t read', () => {
    expect(parseTagColors(undefined)).toEqual({})
    expect(parseTagColors('not json')).toBeNull()
    expect(parseTagColors('[1]')).toBeNull()
  })

  it('drops bad entries and round-trips', () => {
    const text = JSON.stringify({ type: { a: 2, b: 99, c: 'x' }, bad: 3, empty: {} })
    expect(parseTagColors(text)).toEqual({ type: { a: 2 } })
    const colors = withTagColor({ type: { a: 2 } }, 'type', 'b', 5)
    expect(colors).toEqual({ type: { a: 2, b: 5 } })
    expect(parseTagColors(serializeTagColors(colors))).toEqual(colors)
  })
})
