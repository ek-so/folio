import { describe, it, expect } from 'vitest'
import { frontMatter, properties, withKeys, blankFrontMatter, valueList, noteTitle, withoutKeys, renameKey, keyNameError, withValue, valuesOf, valueColors, withoutValue, countValue } from './frontmatter.js'

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

  it('removes properties with their values', () => {
    expect(withoutKeys('---\na: 1\ntags:\n  - x\n  - y\nb: 2\n---\nbody', ['tags'])).toBe('---\na: 1\nb: 2\n---\nbody')
    expect(withoutKeys('---\ntags: x\n---\n# N\n', ['tags'])).toBe('# N\n')
    const same = '---\na: 1\n---\n'
    expect(withoutKeys(same, ['b'])).toBe(same)
  })

  it('renames a property, keeping its value', () => {
    expect(renameKey('---\nprio: high\ntags: [a]\n---\nprio: body', 'prio', 'priority')).toBe('---\npriority: high\ntags: [a]\n---\nprio: body')
    expect(renameKey('# N', 'a', 'b')).toBe('# N')
  })

  it('accepts only property names it can read back', () => {
    expect(keyNameError('status')).toBeNull()
    expect(keyNameError('due date')).toBeNull()
    for (const bad of ['a:b', '-x', '#x', 'a\nb', ' x']) expect(keyNameError(bad)).not.toBeNull()
    expect(frontMatter(withKeys('', ['due date'])).props).toEqual([{ key: 'due date', value: '' }])
  })

  it('sets a property value, keeping the form it had', () => {
    expect(withValue('---\ntype: regular\nx: 1\n---\nB', 'type', 'recurring')).toBe('---\ntype: recurring\nx: 1\n---\nB')
    expect(withValue('---\ntags: [a, b]\n---\n', 'tags', ['a', 'c'])).toBe('---\ntags: [a, c]\n---\n')
    expect(withValue('---\ntags:\n  - a\n  - b\nx: 1\n---\n', 'tags', ['b'])).toBe('---\ntags:\n  - b\nx: 1\n---\n')
    expect(withValue('---\ntags: [a]\n---\n', 'tags', ['a', 'b, c'])).toBe('---\ntags:\n  - a\n  - b, c\n---\n')
    expect(withValue('---\ntags: [a]\n---\n', 'tags', [])).toBe('---\ntags:\n---\n')
    expect(withValue('---\ntype:\n---\n', 'type', '[x]')).toBe('---\ntype: "[x]"\n---\n')
    expect(withValue('---\r\ntype: a\r\n---\r\n', 'type', 'b')).toBe('---\r\ntype: b\r\n---\r\n')
    expect(withValue('# Note\n', 'type', 'a')).toBe('---\ntype: a\n---\n# Note\n')
    expect(properties(withValue('---\ntitle: "x: y"\n---\n', 'title', 'p: q')).title).toBe('p: q')
  })

  it('collects the values a property has', () => {
    const notes = ['---\nt: b\n---', '---\nt: [a, b]\n---', '---\nu: z\n---', 'plain', '---\nt:\n---']
    expect(valuesOf(notes, 't')).toEqual(['a', 'b'])
  })

  it('gives the values of a property different colors', () => {
    const values = ['regular', 'recurring', 'errand', 'x', 'y', 'z', 'one', 'two', 'three', 'four']
    const colors = valueColors('type', values)
    expect(new Set(colors.values()).size).toBe(10)
    expect(valueColors('type', ['a', 'b', 'c']).get('b')).toBe(valueColors('type', ['b', 'c', 'a']).get('b'))
    expect(valueColors('type', ['a']).get('a')).toBe(valueColors('type', ['a', 'q']).get('a'))
  })

  it('takes a value out of a property', () => {
    expect(withoutValue('---\ntype: errand\n---\n', 'type', 'errand')).toBe('---\ntype:\n---\n')
    expect(withoutValue('---\ntype: regular\n---\n', 'type', 'errand')).toBe('---\ntype: regular\n---\n')
    expect(withoutValue('---\ntags: [a, b]\n---\n', 'tags', 'a')).toBe('---\ntags: [b]\n---\n')
    expect(withoutValue('# Note', 'type', 'a')).toBe('# Note')
    expect(countValue(['---\nt: a\n---', '---\nt: [a, b]\n---', '---\nt: b\n---', 'x'], 't', 'a')).toBe(2)
  })
})
