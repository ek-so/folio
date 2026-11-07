import { describe, it, expect } from 'vitest'
import { parseNotes, serializeNotes, movedNotes, isNote, notesHeight, resizedNotes, addedNote, removedNote, replacedNote, reorderedNote } from './note.js'

describe('notes widget', () => {
  it('reads its settings, an older one-note widget too, or nothing from bad text', () => {
    expect(parseNotes('nope')).toBeNull()
    expect(parseNotes('{}')).toBeNull()
    expect(parseNotes('{"file":""}')).toBeNull()
    expect(parseNotes('{"file":"a/b.md","height":480}')).toEqual({ notes: [{ file: 'a/b.md' }], height: 480 })
    expect(parseNotes(serializeNotes({ notes: [{ file: 'a.md' }, { file: 'b.md', height: 5 }, { file: '' }] }))).toEqual({ notes: [{ file: 'a.md' }, { file: 'b.md' }], height: 160 })
    expect(parseNotes('{"notes":[{"file":"a.md","height":400}],"height":600}').height).toBe(600)
    expect(parseNotes('{"notes":[]}')).toEqual({ notes: [] })
  })

  it('resizes, adds, removes and reorders its notes', () => {
    const s = { notes: [{ file: 'a.md' }, { file: 'b.md' }], height: 480 }
    expect(notesHeight({ notes: [] })).toBe(320)
    expect(resizedNotes(s, 600)).toEqual({ notes: s.notes, height: 600 })
    expect(resizedNotes(s, 320)).toEqual({ notes: s.notes })
    expect(addedNote(s, 'c.md').notes.map(n => n.file)).toEqual(['a.md', 'b.md', 'c.md'])
    expect(addedNote(s, 'a.md')).toBe(s)
    expect(removedNote(s, 0)).toEqual({ notes: [{ file: 'b.md' }], height: 480 })
    expect(reorderedNote(s, 1, 0).notes.map(n => n.file)).toEqual(['b.md', 'a.md'])
  })

  it('follows its files when they or a folder above them move', () => {
    const s = { notes: [{ file: 'a/b.md' }, { file: 'c.md' }] }
    expect(movedNotes(s, 'a/b.md', 'c/d.md', false).notes[0]).toEqual({ file: 'c/d.md' })
    expect(movedNotes(s, 'a', 'x/a', true).notes[0].file).toBe('x/a/b.md')
    expect(movedNotes(s, 'ab', 'z', true)).toBe(s)
    expect(movedNotes(s, 'a/c.md', 'a/d.md', false)).toBe(s)
  })

  it('tells notes from other files', () => {
    expect(['a/b.md', 'README.MD', 'pic.png', '.folio/x.md'].filter(isNote)).toEqual(['a/b.md', 'README.MD'])
  })

  it('replaces a note that is gone, in its place', () => {
    const settings = { notes: [{ file: 'a.md' }, { file: 'gone.md' }, { file: 'c.md' }], height: 400 }
    expect(replacedNote(settings, 'gone.md', 'new.md')).toEqual({ notes: [{ file: 'a.md' }, { file: 'new.md' }, { file: 'c.md' }], height: 400 })
    expect(replacedNote(settings, 'gone.md', 'c.md').notes).toEqual([{ file: 'a.md' }, { file: 'c.md' }]) // already there
  })
})
