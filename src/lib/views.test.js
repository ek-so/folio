import { describe, it, expect } from 'vitest'
import { fileView, folderView, defaultViews, mapViews, movedView, removedView } from './views.js'

describe('views', () => {
  it('starts File manager at the root and the other pages on their own content', () => {
    expect(defaultViews()).toEqual({ home: null, files: folderView(''), graph: null })
    expect(mapViews(defaultViews(), () => folderView('x'))).toEqual({ home: null, files: folderView('x'), graph: null })
  })

  it('follows a moved file or folder', () => {
    expect(movedView(fileView('a/x.md'), 'a', 'b/a')).toEqual({ file: 'b/a/x.md', folder: 'b/a' })
    expect(movedView(folderView('ab'), 'a', 'z')).toEqual(folderView('ab'))
    expect(movedView(fileView('a/x.md'), 'a/x.md', 'y.md')).toEqual({ file: 'y.md', folder: 'a' })
  })

  it('falls back to what is left after a delete', () => {
    expect(removedView(fileView('a/x.md'), 'a/x.md')).toEqual(folderView('a'))
    expect(removedView(fileView('a/b/x.md'), 'a/b')).toEqual(folderView('a'))
    expect(removedView(folderView('a/b'), 'a')).toEqual(folderView(''))
    expect(removedView(folderView('ab'), 'a')).toEqual(folderView('ab'))
  })
})
