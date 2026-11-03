import { describe, it, expect } from 'vitest'
import { urlForView, viewForUrl, existingView } from './url.js'

describe('url', () => {
  it('round-trips files and folders, including odd names', () => {
    for (const view of [
      { file: null, folder: '' },
      { file: null, folder: 'a b/c#d' },
      { file: 'notes/é 100%?.md', folder: 'notes' },
      { file: 'x.md', folder: '' },
    ]) {
      expect(viewForUrl('/folio/', urlForView('/folio/', view))).toEqual(view)
    }
  })

  it('rejects other paths and bad encoding', () => {
    expect(viewForUrl('/folio/', '/other/a.md')).toBeNull()
    expect(viewForUrl('/folio/', '/folio/%E0%A4%A')).toBeNull()
  })

  it('falls back to the nearest existing folder', () => {
    const files = new Set(['a/b/c.md'])
    const folders = ['a', 'a/b']
    expect(existingView({ file: 'a/b/c.md', folder: 'a/b' }, files, folders)).toEqual({ file: 'a/b/c.md', folder: 'a/b' })
    expect(existingView({ file: 'a/b/gone.md', folder: 'a/b' }, files, folders)).toEqual({ file: null, folder: 'a/b' })
    expect(existingView({ file: null, folder: 'a/x/y' }, files, folders)).toEqual({ file: null, folder: 'a' })
    expect(existingView({ file: 'z.md', folder: '' }, files, folders)).toEqual({ file: null, folder: '' })
  })
})
