import { describe, it, expect } from 'vitest'
import { parseIcons, serializeIcons, leadingEmoji, withoutEmoji, iconOf, withIcon, movedIcons, removedIcons } from './icons.js'

describe('icons', () => {
  it('reads its file, none, or nothing from bad text', () => {
    expect(parseIcons(undefined)).toEqual({})
    expect(parseIcons('nope')).toBeNull()
    expect(parseIcons('{"icons":["a"]}')).toBeNull()
    expect(parseIcons('{"icons":{"a.md":"📝","b.md":3,"":"x"}}')).toEqual({ 'a.md': '📝' })
    expect(parseIcons(serializeIcons({ 'b.md': '🌱', 'a.md': '📝' }))).toEqual({ 'a.md': '📝', 'b.md': '🌱' })
  })

  it('finds the emoji a name starts with', () => {
    expect(leadingEmoji('📝 Plan.md')).toBe('📝')
    expect(leadingEmoji('👩‍💻 Work')).toBe('👩‍💻')
    expect(leadingEmoji('🇫🇷 Paris')).toBe('🇫🇷')
    expect(leadingEmoji('2024 Plan')).toBe('')
    expect(leadingEmoji('Plan 📝')).toBe('')
    expect(withoutEmoji('📝 Plan')).toBe('Plan')
    expect(withoutEmoji('📝')).toBe('📝')
    expect(withoutEmoji('Plan')).toBe('Plan')
  })

  it('shows the chosen emoji, else the name\'s own', () => {
    expect(iconOf({ 'a.md': '🌱' }, 'a.md')).toBe('🌱')
    expect(iconOf({}, 'Life/📝 a.md')).toBe('📝')
    expect(iconOf({ 'Life/📝 a.md': '' }, 'Life/📝 a.md')).toBe('')
    expect(iconOf({}, 'a.md')).toBe('')
  })

  it('sets, clears, follows moves and forgets deletes', () => {
    expect(withIcon({}, 'a.md', '🌱')).toEqual({ 'a.md': '🌱' })
    expect(withIcon({ 'a.md': '🌱' }, 'a.md', '')).toEqual({})
    expect(withIcon({}, '📝 a.md', '')).toEqual({ '📝 a.md': '' })
    expect(movedIcons({ 'Life/a.md': '🌱', 'Life b.md': '📝' }, 'Life', 'Home', true)).toEqual({ 'Home/a.md': '🌱', 'Life b.md': '📝' })
    expect(removedIcons({ 'Life/a.md': '🌱', 'Lifestyle/b.md': '📝' }, 'Life', true)).toEqual({ 'Lifestyle/b.md': '📝' })
  })
})
