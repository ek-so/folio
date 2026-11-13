import { describe, it, expect } from 'vitest'
import { searchEmojis, emojiGroups } from './emojis.js'
import { emojiNamed, withAdoptedIcon, parseIcons, serializeIcons, leadingEmoji, withoutEmoji, iconOf, withIcon, movedIcons, removedIcons } from './icons.js'

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
    expect(iconOf({}, 'constructor')).toBe('')
  })

  it('sets, clears, follows moves and forgets deletes', () => {
    expect(withIcon({}, 'a.md', '🌱')).toEqual({ 'a.md': '🌱' })
    expect(withIcon({ 'a.md': '🌱' }, 'a.md', '')).toEqual({})
    expect(withIcon({}, '📝 a.md', '')).toEqual({ '📝 a.md': '' })
    expect(movedIcons({ 'Life/a.md': '🌱', 'Life b.md': '📝' }, 'Life', 'Home', true)).toEqual({ 'Home/a.md': '🌱', 'Life b.md': '📝' })
    expect(removedIcons({ 'Life/a.md': '🌱', 'Lifestyle/b.md': '📝' }, 'Life', true)).toEqual({ 'Lifestyle/b.md': '📝' })
  })

  it('searches the emojis by the words that start theirs', () => {
    const data = [{ name: 'Travel & Places', emojis: [
      { emoji: '🏠', name: 'house', emoji_version: '0.6' }, { emoji: '🏡', name: 'house with garden', emoji_version: '0.6' },
      { emoji: '🛝', name: 'playground slide', emoji_version: '14.0' },
    ] }]
    const groups = emojiGroups(data, 13)
    expect(groups.map(g => g.name)).toEqual(['Suggested', 'Travel & Places'])
    expect(groups[1].emojis.map(e => e.emoji)).toEqual(['🏠', '🏡']) // newer than the device draws: left out
    expect(searchEmojis(groups, 'hom')).toEqual(['🏠']) // Suggested's words
    expect(searchEmojis(groups, 'house gar')).toEqual(['🏡']) // its name's
    expect(searchEmojis(groups, 'coffee')).toEqual(['☕'])
    expect(searchEmojis(groups, 'xyz')).toEqual([])
  })

  it('finds the names an emoji can leave, shallowest first', () => {
    const found = emojiNamed(['🌱 Life/📝 Plan.md', 'Life/a.md', '📝.md', '🌱 Life/.gitkeep', '.archive/📝 x.md', '.folio/🔥.json', '🔥 Hot/b.md'])
    expect(found.map(e => [e.path, e.to, e.type])).toEqual([
      ['🌱 Life', 'Life', 'dir'],
      ['🔥 Hot', 'Hot', 'dir'],
      ['🌱 Life/📝 Plan.md', '🌱 Life/Plan.md', 'file'],
    ])
    expect(found[0].emoji).toBe('🌱')
  })

  it('adopts a name\'s emoji unless an icon is chosen', () => {
    expect(withAdoptedIcon({}, 'Life', '🌱')).toEqual({ Life: '🌱' })
    expect(withAdoptedIcon({ Life: '⭐' }, 'Life', '🌱')).toEqual({ Life: '⭐' })
    expect(withAdoptedIcon({ Life: '' }, 'Life', '🌱')).toEqual({ Life: '' })
  })
})
