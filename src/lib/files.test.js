import { describe, it, expect } from 'vitest'
import { itemsIn, fileKind, audioMime } from './files.js'

describe('files', () => {
  it('counts what a folder holds right inside it', () => {
    const files = ['a.md', 'A/b.md', 'A/c.png', 'A/B/d.md'], folders = ['A', 'A/B']
    expect(itemsIn('A', files, folders)).toBe(3)
    expect(itemsIn('', files, folders)).toBe(2)
  })
})

describe('file kinds', () => {
  it('knows audio, images, PDFs and notes', () => {
    expect(['a.MP3', 'b.m4a', 'c.ogg', 'd.opus', 'e.wav'].map(fileKind)).toEqual(['audio', 'audio', 'audio', 'audio', 'audio'])
    expect(audioMime('song.ogg')).toBe('audio/ogg')
    expect([fileKind('a.md'), fileKind('a.pdf'), fileKind('a.jpg'), fileKind('a.zip')]).toEqual(['note', 'pdf', 'image', 'file'])
  })
})
