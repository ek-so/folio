import { describe, it, expect } from 'vitest'
import { parseNotes, serializeNotes, movedNotes, isNote, noteHeight, resizedNote, addedNote, removedNote, reorderedNote } from './note.js'

describe('notes widget', () => {
  it('reads its settings, an older one-note widget too, or nothing from bad text', () => {
    expect(parseNotes('nope')).toBeNull()
    expect(parseNotes('{}')).toBeNull()
    expect(parseNotes('{"file":""}')).toBeNull()
    expect(parseNotes('{"file":"a/b.md","height":480}')).toEqual({ notes: [{ file: 'a/b.md', height: 480 }] })
    expect(parseNotes(serializeNotes({ notes: [{ file: 'a.md' }, { file: 'b.md', height: 5 }, { file: '' }] }))).toEqual({ notes: [{ file: 'a.md' }, { file: 'b.md', height: 160 }] })
    expect(parseNotes('{"notes":[]}')).toEqual({ notes: [] })
  })

  it('resizes, adds, removes and reorders its notes', () => {
    const s = { notes: [{ file: 'a.md' }, { file: 'b.md', height: 480 }] }
    expect(noteHeight(s.notes[0])).toBe(320)
    expect(resizedNote(s, 0, 480).notes[0]).toEqual({ file: 'a.md', height: 480 })
    expect(resizedNote(s, 1, 320).notes[1]).toEqual({ file: 'b.md' })
    expect(addedNote(s, 'c.md').notes.map(n => n.file)).toEqual(['a.md', 'b.md', 'c.md'])
    expect(addedNote(s, 'a.md')).toBe(s)
    expect(removedNote(s, 0).notes).toEqual([{ file: 'b.md', height: 480 }])
    expect(reorderedNote(s, 1, 0).notes.map(n => n.file)).toEqual(['b.md', 'a.md'])
  })

  it('follows its files when they or a folder above them move', () => {
    const s = { notes: [{ file: 'a/b.md', height: 480 }, { file: 'c.md' }] }
    expect(movedNotes(s, 'a/b.md', 'c/d.md', false).notes[0]).toEqual({ file: 'c/d.md', height: 480 })
    expect(movedNotes(s, 'a', 'x/a', true).notes[0].file).toBe('x/a/b.md')
    expect(movedNotes(s, 'ab', 'z', true)).toBe(s)
    expect(movedNotes(s, 'a/c.md', 'a/d.md', false)).toBe(s)
  })

  it('tells notes from other files', () => {
    expect(['a/b.md', 'README.MD', 'pic.png', '.folio/x.md'].filter(isNote)).toEqual(['a/b.md', 'README.MD'])
  })
})
