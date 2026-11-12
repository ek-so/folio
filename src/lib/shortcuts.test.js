import { describe, it, expect } from 'vitest'
import { isMacPlatform, searchKeys, isSearchShortcut } from './shortcuts.js'

describe('shortcuts', () => {
  it('opens Search with ⌘K on a Mac and Ctrl+K elsewhere', () => {
    expect(isMacPlatform('MacIntel')).toBe(true)
    expect(isMacPlatform('Win32')).toBe(false)
    expect(searchKeys(true)).toEqual(['⌘', 'K'])
    expect(searchKeys(false)).toEqual(['Ctrl', 'K'])
    expect(isSearchShortcut({ key: 'k', metaKey: true }, true)).toBe(true)
    expect(isSearchShortcut({ key: 'K', ctrlKey: true }, false)).toBe(true)
    expect(isSearchShortcut({ key: 'k', ctrlKey: true }, true)).toBe(false)
    expect(isSearchShortcut({ key: 'k', metaKey: true, shiftKey: true }, true)).toBe(false)
    expect(isSearchShortcut({ key: 'j', metaKey: true }, true)).toBe(false)
  })
})
