import { describe, it, expect } from 'vitest'
import { parseNote, serializeNote, noteSettings, movedNote, noteWidgetTitle } from './note.js'
import { NOTE_HEIGHT } from '../../lib/resize.js'

describe('note widget', () => {
  it('reads its settings, or nothing from bad text', () => {
    expect(parseNote('nope')).toBeNull()
    expect(parseNote('{}')).toBeNull()
    expect(parseNote('{"path":""}')).toBeNull()
    expect(parseNote(serializeNote({ path: 'a/b.md', height: 300 }))).toEqual({ path: 'a/b.md', height: 300 })
    expect(serializeNote({ path: 'a.md', height: NOTE_HEIGHT.default })).not.toContain('height')
    expect(noteSettings(() => ({ ready: true }), 'w')).toBeNull()
    expect(noteSettings(() => ({ ready: true, text: '{"path":"a.md","height":"x"}' }), 'w')).toEqual({ path: 'a.md', height: NOTE_HEIGHT.default })
    expect(parseNote('{"path":"a.md","height":1}').height).toBe(NOTE_HEIGHT.min)
  })

  it('is titled by its note', () => {
    expect(noteWidgetTitle(null, {})).toBe('Note')
    expect(noteWidgetTitle({ path: 'a/Plan.md' }, {})).toBe('Plan')
    expect(noteWidgetTitle({ path: 'a/Plan.md' }, { 'a/Plan.md': '# Big plan\n' })).toBe('Big plan')
  })

  it('follows its note when it or a folder above it moves', () => {
    const s = { path: 'A/b.md', height: 300 }
    expect(movedNote(s, 'A/b.md', 'C/b.md', false)).toEqual({ path: 'C/b.md', height: 300 })
    expect(movedNote(s, 'A', 'D', true)).toEqual({ path: 'D/b.md', height: 300 })
    expect(movedNote(s, 'Ab', 'X', true)).toBe(s)
    expect(movedNote(s, 'A/c.md', 'A/d.md', false)).toBe(s)
  })
})
