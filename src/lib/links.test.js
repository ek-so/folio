import { describe, it, expect } from 'vitest'
import { extractLinks, buildIndex, rewriteLinks, suggestFix, retargetLink, resolveSymlink, SYMLINK_MODE } from './links.js'

const files = {
  'Life/Packing.md': {}, 'Life/Trip.md': {}, 'Travel/Italy.md': {}, 'img/My Pic.png': {},
}
const move = (from, to) => p => p === from || p.startsWith(from + '/') ? to + p.slice(from.length) : p

describe('links', () => {
  it('finds links outside code, with targets as written', () => {
    const md = 'See [Packing](Packing.md) and ![p](<../img/My Pic.png>).\n`[no](x.md)`\n```\n[no](y.md)\n```\n[ref]: Trip.md\n'
    expect(extractLinks(md).map(l => [l.text, l.target])).toEqual([
      ['Packing', 'Packing.md'], ['p', '../img/My Pic.png'], [null, 'Trip.md'],
    ])
  })

  it('indexes backlinks and broken links', () => {
    const notes = { 'Life/Trip.md': '[Packing](Packing.md) [gone](Old.md) [web](https://x.com)', 'Travel/Italy.md': '[trip](../Life/Trip)' }
    const { backlinks, broken } = buildIndex(notes, files)
    expect(Object.keys(backlinks).sort()).toEqual(['Life/Packing.md', 'Life/Trip.md'])
    expect(backlinks['Life/Trip.md'][0].from).toBe('Travel/Italy.md')
    expect(broken.map(b => b.link.target)).toEqual(['Old.md'])
  })

  it('rewrites links to a renamed file in the same style, renaming matching link text', () => {
    const text = '[Packing](Packing.md), [list](./Packing#top), [Packing.md](/Life/Packing.md)'
    const out = rewriteLinks(text, 'Life/Trip.md', 'Life/Trip.md', move('Life/Packing.md', 'Life/Gear list.md'), files)
    expect(out).toBe('[Gear list](Gear%20list.md), [list](./Gear%20list#top), [Gear list.md](/Life/Gear%20list.md)')
  })

  it("keeps a moved note's own links working and follows folder renames", () => {
    const out = rewriteLinks('[p](Packing.md) ![x](../img/My%20Pic.png)', 'Life/Trip.md', 'Travel/Trip.md', move('Life/Trip.md', 'Travel/Trip.md'), files)
    expect(out).toBe('[p](../Life/Packing.md) ![x](../img/My%20Pic.png)')
    expect(rewriteLinks('[i](../Travel/Italy.md)', 'Life/Trip.md', 'Life/Trip.md', move('Travel', 'Trips'), files))
      .toBe('[i](../Trips/Italy.md)')
  })

  it('suggests the only file with a broken link\'s name', () => {
    const [l] = extractLinks('[x](Italy.md)')
    expect(suggestFix(l, files)).toBe('Travel/Italy.md')
    expect(retargetLink('[x](Italy.md)', 'Life/Trip.md', l, 'Travel/Italy.md')).toBe('[x](../Travel/Italy.md)')
  })
})

describe('symlinks', () => {
  const tree = {
    'notes/a.md': {}, 'docs/guide/x.md': {},
    'link.md': { mode: SYMLINK_MODE }, 'notes/hop.md': { mode: SYMLINK_MODE },
  }
  it('resolves a link to a file, a folder, or another link', () => {
    expect(resolveSymlink('notes/l.md', 'a.md', tree)).toEqual({ kind: 'note', path: 'notes/a.md' })
    expect(resolveSymlink('notes/g', '../docs/guide', tree)).toEqual({ kind: 'folder', path: 'docs/guide' })
    expect(resolveSymlink('link.md', 'notes/hop.md', tree, { 'notes/hop.md': 'a.md' })).toEqual({ kind: 'note', path: 'notes/a.md' })
  })
  it('flags links outside the repo or to nothing', () => {
    expect(resolveSymlink('a', '/etc/hosts', tree)).toEqual({ error: 'outside' })
    expect(resolveSymlink('notes/a', '../../x', tree)).toEqual({ error: 'outside' })
    expect(resolveSymlink('a', 'gone.md', tree)).toEqual({ error: 'missing' })
  })
})

describe('links inside code', () => {
  it('skips mixed fences and double-backtick spans', () => {
    const md = '~~~\n```\n[a](x.md)\n~~~\n``[b](x.md)`` and [c](x.md)\n'
    expect(extractLinks(md).map(l => l.text)).toEqual(['c'])
  })
})
