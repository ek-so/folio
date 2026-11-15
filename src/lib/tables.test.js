import { describe, it, expect } from 'vitest'
import { detectType, parseNumber, sortedRows, cellPasses, tableRows, withCells, checkboxText, parseTables, serializeTables, withColumnType, withValueColor, columnValues } from './tables.js'

const cells = texts => texts.map(text => ({ text, link: false }))

describe('tables', () => {
  it('tells a column\'s type from its cells', () => {
    expect(detectType(cells(['Done', 'Todo', 'Done']))).toBe('select')
    expect(detectType(cells(['work, urgent', 'home', 'work']))).toBe('multi')
    expect(detectType(cells(['12', '1,200.50', '3%', '']))).toBe('number')
    expect(detectType(cells(['17 Oct 2026', '2026-10-18', '']))).toBe('date')
    expect(detectType(cells(['x', '', 'x']))).toBe('checkbox')
    expect(detectType(cells(['yes', 'no']))).toBe('checkbox')
    expect(detectType(cells(['Call the bank', 'Buy milk', 'Write report']))).toBe('text')
    expect(detectType([{ text: 'Site', link: true }, { text: 'Other', link: true }])).toBe('link')
    expect(detectType(cells(['', '']))).toBe('text')
  })

  it('reads numbers as written', () => {
    expect(parseNumber('1,234.5')).toBe(1234.5)
    expect(parseNumber('3,5')).toBe(3.5)
    expect(parseNumber('$40')).toBe(40)
    expect(parseNumber('-2')).toBe(-2)
    expect(parseNumber('12 apples')).toBe(null)
  })

  it('sorts rows by a column, empty ones last', () => {
    expect(sortedRows('number', ['10', '', '9', '100'], 'asc')).toEqual([2, 0, 3, 1])
    expect(sortedRows('number', ['10', '', '9', '100'], 'desc')).toEqual([3, 0, 2, 1])
    expect(sortedRows('text', ['b', 'A', 'c'], 'asc')).toEqual([1, 0, 2])
    expect(sortedRows('date', ['18 Oct 2026', '17 Oct 2026'], 'asc')).toEqual([1, 0])
    expect(sortedRows('checkbox', ['x', '', 'x'], 'asc')).toEqual([1, 0, 2])
  })

  it('filters cells by their type', () => {
    expect(cellPasses('select', 'Done', { values: ['Done'] })).toBe(true)
    expect(cellPasses('select', 'Todo', { values: ['Done'] })).toBe(false)
    expect(cellPasses('multi', 'work, home', { values: ['home'] })).toBe(true)
    expect(cellPasses('number', '5', { min: 1, max: 5 })).toBe(true)
    expect(cellPasses('number', '', { min: 1 })).toBe(false)
    expect(cellPasses('date', '17 Oct 2026, 10:00', { from: { year: 2026, month: 10, day: 17 } })).toBe(true)
    expect(cellPasses('date', '16 Oct 2026', { from: { year: 2026, month: 10, day: 17 } })).toBe(false)
    expect(cellPasses('checkbox', '', 'open')).toBe(true)
    expect(cellPasses('checkbox', 'x', 'open')).toBe(false)
  })

  it('writes cells back into the table\'s markdown', () => {
    const raw = '| A | B |\n|---|---|\n| 1 | x |\n| a\\|b | 2\n| 3 |\n'
    expect(tableRows(raw).map(r => r.cells.length)).toEqual([2, 2, 1])
    expect(withCells(raw, [{ row: 0, col: 1, text: 'a|b' }, { row: 2, col: 1, text: 'new' }, { row: 1, col: 0, text: 'z' }]))
      .toBe('| A | B |\n|---|---|\n| 1 | a\\|b |\n| z | 2\n| 3 | new |\n')
    // As on GitHub, a pipe in `code` splits cells too, so the columns line up with the preview's
    expect(withCells('| a | b | c |\n|---|---|---|\n| `p|q` | r |\n', [{ row: 0, col: 1, text: 'X' }])).toBe('| a | b | c |\n|---|---|---|\n| `p| X | r |\n')
    expect(tableRows('> | A |\n> |---|\n')).toBe(null)
  })

  it('ticks a checkbox in the column\'s own words', () => {
    expect(checkboxText(['yes', 'no'], false)).toBe('no')
    expect(checkboxText(['✓', ''], true)).toBe('✓')
    expect(checkboxText(['', ''], true)).toBe('x')
  })

  it('lists a column\'s values', () => {
    expect(columnValues('multi', ['b, a', 'a', ''])).toEqual(['a', 'b'])
  })

  it('keeps picked types and colors per note and column', () => {
    let t = withColumnType({}, 'a.md', 'Status', 'select')
    t = withValueColor(t, 'a.md', 'Status', 'Done', 3)
    t = withValueColor(t, 'a.md', 'Status', 'Finished', 3)
    expect(parseTables(serializeTables(t))).toEqual({ 'a.md': { Status: { type: 'select', colors: { Done: 3, Finished: 3 } } } })
    expect(withColumnType(withColumnType({}, 'a.md', 'S', 'date'), 'a.md', 'S', null)).toEqual({})
    expect(parseTables('nope')).toBe(null)
    expect(parseTables(undefined)).toEqual({})
  })
})
