import { describe, it, expect } from 'vitest'
import { parseAdded, serializeAdded, withAdded, movedAdded, removedAdded, assetList } from './assets.js'

describe('assets', () => {
  it('reads its file, none, or nothing from bad text', () => {
    expect(parseAdded(undefined)).toEqual({})
    expect(parseAdded('nope')).toBeNull()
    expect(parseAdded('{"added":[]}')).toBeNull()
    expect(parseAdded('{"added":{"a.png":"2026-01-01","b.png":3}}')).toEqual({ 'a.png': '2026-01-01' })
    expect(parseAdded(serializeAdded(withAdded({}, 'b.png', 't')))).toEqual({ 'b.png': 't' })
  })

  it('follows moves and forgets deletes', () => {
    expect(movedAdded({ 'pics/a.png': 't', 'x.png': 'u' }, 'pics', 'img', true)).toEqual({ 'img/a.png': 't', 'x.png': 'u' })
    expect(removedAdded({ 'pics/a.png': 't', 'x.png': 'u' }, 'pics', true)).toEqual({ 'x.png': 'u' })
  })

  it('lists files that aren\'t notes, newest added first, the rest by path', () => {
    const paths = ['b.png', 'a.md', 'a.pdf', '.folio/views.json', '.archive/2026-11-01/x.png', 'pics/.gitkeep', 'c.png', 'old.zip']
    const added = { 'c.png': '2026-11-08T10:00:00.000Z', 'b.png': '2026-11-09T10:00:00.000Z' }
    expect(assetList(paths, added)).toEqual(['b.png', 'c.png', 'a.pdf', 'old.zip'])
  })
})
