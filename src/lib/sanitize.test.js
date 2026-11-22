import { describe, it, expect } from 'vitest'
import { contained, ownClasses } from './sanitize.js'

describe('sanitize', () => {
  it('keeps a note\'s styles inside the note', () => {
    expect(contained('color: red; position: fixed; inset: 0; z-index: 99')).toBe('color: red')
    expect(contained('font-weight:bold;TOP:0;left: 10px;transform: scale(9)')).toBe('font-weight:bold')
    expect(contained('background: url(x); inset-inline-start: 0')).toBe('background: url(x)')
    expect(contained('--gap-lines: 3')).toBe('--gap-lines: 3')
  })

  it('reads a property the way the browser does: no comment or escape lets one through', () => {
    expect(contained('position/**/: fixed; color: red')).toBe('color: red')
    expect(contained('p\\osition: fixed; color: red')).toBe('color: red')
    expect(contained('color: red; /* position: fixed')).toBe('color: red')
  })

  it('keeps only the classes Folio gives', () => {
    expect(ownClasses('fixed inset-0 z-50')).toBe('')
    expect(ownClasses('callout callout-tip')).toBe('callout callout-tip')
    expect(ownClasses('date-spot bg-background')).toBe('date-spot')
    expect(ownClasses('language-js')).toBe('language-js')
  })
})
