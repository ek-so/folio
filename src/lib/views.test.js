import { describe, it, expect } from 'vitest'
import { fileView, folderView, startTrails, currentView, openView, trailTo, movedTrails, keptTrails } from './views.js'

describe('views', () => {
  it('starts every page at its own start', () => {
    expect(startTrails(['home', 'files', 'graph'])).toEqual({ home: [], files: [], graph: [] })
    expect(currentView('home', [])).toBeNull()
    expect(currentView('files', [])).toEqual(folderView(''))
  })

  it('adds opened views to the trail; the start clears it', () => {
    let t = openView('home', [], folderView('a'))
    t = openView('home', t, fileView('a/x.md'))
    expect(openView('home', t, fileView('a/x.md'))).toBe(t)
    expect(currentView('home', t)).toEqual(fileView('a/x.md'))
    expect(openView('files', t, folderView(''))).toEqual([])
  })

  it('goes back along the trail for Back / Forward', () => {
    const t = [folderView('a'), fileView('a/x.md'), folderView('b')]
    expect(trailTo('home', t, fileView('a/x.md'))).toEqual(t.slice(0, 2))
    expect(trailTo('home', t, folderView('c'))).toEqual([...t, folderView('c')])
    expect(trailTo('home', t, null)).toEqual([])
  })

  it('follows moves and drops deleted items', () => {
    const trails = { home: [folderView('a'), fileView('a/x.md')], files: [folderView('ab')], graph: [] }
    expect(movedTrails(trails, 'a', 'b/a').home).toEqual([folderView('b/a'), fileView('b/a/x.md')])
    expect(movedTrails(trails, 'a', 'b/a').files).toEqual([folderView('ab')])
    expect(keptTrails(trails, v => v.file !== 'a/x.md').home).toEqual([folderView('a')])
    expect(keptTrails({ files: [folderView('b'), folderView('a'), folderView('b')] }, v => v.folder !== 'a').files).toEqual([folderView('b')])
  })
})
