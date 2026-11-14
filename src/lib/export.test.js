import { describe, it, expect } from 'vitest'
import { exportText, exportName } from './export.js'

describe('export', () => {
  it('names the file after the note', () => {
    expect(exportName('Plan.md', 'txt')).toBe('Plan.txt')
  })

  it('gives plain text without properties or markdown, the title once', () => {
    const note = '---\nstatus: Done\n---\n# Plan\n\nSome **bold** and a [link](x.md).\n\n- [x] one\n- two\n\n1. a\n2. b\n\n> quoted\n'
    expect(exportText(note, 'Plan')).toBe('Plan\n\nSome bold and a link.\n\n- [x] one\n- two\n\n1. a\n2. b\n\n> quoted\n')
  })

  it('puts the title on top when the text doesn\'t start with it', () => {
    expect(exportText('---\ntitle: Trip\n---\nPack & go\n', 'trip')).toBe('Trip\n\nPack & go\n')
    expect(exportText('Just text\n', 'note')).toBe('note\n\nJust text\n')
  })
})
