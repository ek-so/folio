import { describe, it, expect } from 'vitest'
import { frontMatter, properties, withKeys, blankFrontMatter, valueList, noteTitle } from './frontmatter.js'

describe('front matter', () => {
  it('reads flat keys, lists and quoted values', () => {
    const text = '---\nstatus: In progress\ntags: [a, "b"]\nowners:\n  - Ann\n  - Bo\ndescription:\ntitle: "x: y"\n---\n# Note\n'
    expect(properties(text)).toEqual({ status: 'In progress', tags: ['a', 'b'], owners: ['Ann', 'Bo'], description: '', title: 'x: y' })
  })

  it('needs the block at the very top, closed', () => {
    expect(frontMatter('# Note\n---\na: 1\n---\n')).toBeNull()
    expect(frontMatter('---\na: 1\n')).toBeNull()
    expect(frontMatter('---\n---\nbody').props).toEqual([])
  })

  it('adds missing keys empty, keeping the rest', () => {
    expect(withKeys('---\na: 1\n---\nbody', ['a', 'description'])).toBe('---\na: 1\ndescription:\n---\nbody')
    expect(withKeys('# Note\n', ['description'])).toBe('---\ndescription:\n---\n# Note\n')
    const same = '---\ndescription: x\n---\n'
    expect(withKeys(same, ['description'])).toBe(same)
    expect(properties(withKeys('# N', ['description', 'due']))).toEqual({ description: '', due: '' })
  })

  it('blanks the block for the preview without moving offsets', () => {
    const text = '---\na: 1\n---\n# Note'
    const blank = blankFrontMatter(text)
    expect(blank.length).toBe(text.length)
    expect(blank.trim()).toBe('# Note')
  })

  it('lists only values worth showing', () => {
    expect(valueList('')).toEqual([])
    expect(valueList(['a', ''])).toEqual(['a'])
    expect(valueList('x')).toEqual(['x'])
  })

  it('finds a note\'s title', () => {
    expect(noteTitle('---\ntitle: From props\n---\n# Heading\n', 'file')).toBe('From props')
    expect(noteTitle('---\ndescription: x\n---\nIntro\n\n# The heading #\n', 'file')).toBe('The heading')
    expect(noteTitle('## Only h2\n', 'file')).toBe('file')
  })
})
