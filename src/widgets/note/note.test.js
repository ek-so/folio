import { describe, it, expect } from 'vitest'
import { parseNote, serializeNote, movedNote, folderNotes, noteHeight, resizedNote } from './note.js'

describe('note widget', () => {
  it('reads its settings, or nothing from bad text', () => {
    expect(parseNote('nope')).toBeNull()
    expect(parseNote('{}')).toBeNull()
    expect(parseNote('{"file":""}')).toBeNull()
    expect(parseNote(serializeNote({ file: 'a/b.md' }))).toEqual({ file: 'a/b.md' })
  })

  it('keeps a resized height within limits, else the default', () => {
    expect(parseNote('{"file":"a.md","height":480}')).toEqual({ file: 'a.md', height: 480 })
    expect(parseNote('{"file":"a.md","height":5}').height).toBe(160)
    expect(parseNote('{"file":"a.md","height":"tall"}')).toEqual({ file: 'a.md' })
    expect(noteHeight({ file: 'a.md' })).toBe(320)
    expect(movedNote({ file: 'a.md', height: 480 }, 'a.md', 'b.md', false)).toEqual({ file: 'b.md', height: 480 })
    expect(resizedNote({ file: 'a.md' }, 480)).toEqual({ file: 'a.md', height: 480 })
    expect(resizedNote({ file: 'a.md', height: 480 }, 320)).toEqual({ file: 'a.md' })
  })

  it('follows its file when it or a folder above it moves', () => {
    const note = { file: 'a/b.md' }
    expect(movedNote(note, 'a/b.md', 'c/d.md', false)).toEqual({ file: 'c/d.md' })
    expect(movedNote(note, 'a', 'x/a', true)).toEqual({ file: 'x/a/b.md' })
    expect(movedNote(note, 'ab', 'z', true)).toBe(note)
    expect(movedNote(note, 'a/c.md', 'a/d.md', false)).toBe(note)
  })

  it('lists the markdown files right in a folder', () => {
    const files = ['a/z.md', 'a/b.md', 'a/pic.png', 'a/sub/c.md', 'root.md', 'README.MD']
    expect(folderNotes(files, 'a')).toEqual(['a/b.md', 'a/z.md'])
    expect(folderNotes(files, '')).toEqual(['README.MD', 'root.md'])
  })
})
