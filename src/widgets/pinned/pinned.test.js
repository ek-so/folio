import { describe, it, expect } from 'vitest'
import { parsePinned, serializePinned, settingsOf, settingsWrite, movedPinned, isNote, addedItem, removedItem, replacedItem, reorderedItem } from './pinned.js'

describe('pinned widget', () => {
  it('reads its settings, an older Notes widget too, or nothing from bad text', () => {
    expect(parsePinned('nope')).toBeNull()
    expect(parsePinned('{}')).toBeNull()
    expect(parsePinned('{"file":""}')).toBeNull()
    expect(parsePinned('{"file":"a/b.md","height":480}')).toEqual({ items: [{ path: 'a/b.md' }] })
    expect(parsePinned('{"notes":[{"file":"a.md","height":400},{"file":""}],"height":600}')).toEqual({ items: [{ path: 'a.md' }] })
    const s = { items: [{ path: 'a.md' }, { path: 'Folder' }] }
    expect(parsePinned(serializePinned(s))).toEqual(s)
  })

  it('reads the old settings file only when there is no new one', () => {
    const files = { '.folio/pinned/w.json': 'new', '.folio/notes/w.json': 'old', '.folio/notes/v.json': 'old' }
    const read = path => ({ ready: true, text: files[path] })
    expect(settingsOf(read, 'w').text).toBe('new')
    expect(settingsOf(read, 'v').text).toBe('old')
    expect(settingsOf(read, 'x').text).toBeUndefined()
  })

  it('saves to the new file and removes the old one', () => {
    const config = { write: (path, text) => ch => ({ ...ch, [path]: text }), erase: path => ch => Object.fromEntries(Object.entries(ch).filter(([p]) => p !== path)) }
    const saved = settingsWrite(config, 'w', { items: [{ path: 'a.md' }] })({ '.folio/notes/w.json': 'old' })
    expect(Object.keys(saved)).toEqual(['.folio/pinned/w.json'])
    expect(parsePinned(saved['.folio/pinned/w.json'])).toEqual({ items: [{ path: 'a.md' }] })
  })

  it('adds, removes, replaces and reorders its items', () => {
    const s = { items: [{ path: 'a.md' }, { path: 'B' }] }
    expect(addedItem(s, 'c.md').items.map(n => n.path)).toEqual(['a.md', 'B', 'c.md'])
    expect(addedItem(s, 'a.md')).toBe(s)
    expect(removedItem(s, 0)).toEqual({ items: [{ path: 'B' }] })
    expect(reorderedItem(s, 1, 0).items.map(n => n.path)).toEqual(['B', 'a.md'])
    expect(replacedItem(s, 'B', 'C')).toEqual({ items: [{ path: 'a.md' }, { path: 'C' }] })
    expect(replacedItem(s, 'B', 'a.md')).toEqual({ items: [{ path: 'a.md' }] }) // already pinned
  })

  it('follows its files and folders when they or a folder above them move', () => {
    const s = { items: [{ path: 'a/b.md' }, { path: 'a' }, { path: 'c.md' }] }
    expect(movedPinned(s, 'a/b.md', 'c/d.md', false).items[0]).toEqual({ path: 'c/d.md' })
    expect(movedPinned(s, 'a', 'x/a', true).items.map(n => n.path)).toEqual(['x/a/b.md', 'x/a', 'c.md'])
    expect(movedPinned(s, 'ab', 'z', true)).toBe(s)
  })

  it('tells notes from other files', () => {
    expect(['a/b.md', 'README.MD', 'pic.png', '.folio/x.md'].filter(isNote)).toEqual(['a/b.md', 'README.MD'])
  })
})
