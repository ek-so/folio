import { describe, it, expect } from 'vitest'
import { parseBoard, serializeBoard, newBoard, boardColumns, movedBoard, withBoardKeys, placeCard, moveColumn, LOOSE } from './board.js'
import { empty, add } from './changes.js'

const files = ['T/Todo/b.md', 'T/Todo/a.md', 'T/Done/2025/old.md', 'T/Done/.gitkeep', 'T/Empty/.gitkeep', 'T/loose.md', 'Other/x.md']

describe('board', () => {
  it('reads its settings, or nothing from bad text', () => {
    expect(parseBoard('nope')).toBeNull()
    expect(parseBoard('{}')).toBeNull()
    const b = { ...newBoard('T'), columns: ['Done'] }
    expect(parseBoard(serializeBoard(b))).toEqual(b)
  })

  it('has a column per subfolder, cards at any depth, loose files apart', () => {
    const { columns, loose, missing } = boardColumns(newBoard('T'), files)
    expect(columns.map(c => c.name)).toEqual(['Done', 'Empty', 'Todo'])
    expect(columns[0].cards).toEqual([{ key: '2025/old.md', path: 'T/Done/2025/old.md' }])
    expect(columns[1].cards).toEqual([])
    expect(columns[2].cards.map(c => c.key)).toEqual(['a.md', 'b.md'])
    expect(loose.map(c => c.path)).toEqual(['T/loose.md'])
    expect(missing).toBe(false)
    expect(boardColumns(newBoard('Gone'), files).missing).toBe(true)
  })

  it('follows the saved order, the rest by name after it', () => {
    const board = { ...newBoard('T'), columns: ['Todo', 'Gone'], cards: { Todo: ['b.md'] } }
    const { columns } = boardColumns(board, files)
    expect(columns.map(c => c.name)).toEqual(['Todo', 'Done', 'Empty'])
    expect(columns[0].cards.map(c => c.key)).toEqual(['b.md', 'a.md'])
  })

  it('keeps its order when things are renamed', () => {
    const board = { ...newBoard('T'), columns: ['Todo', 'Done'], cards: { Todo: ['b.md', 'a.md'] } }
    expect(movedBoard(board, 'T', 'Tasks', true).folder).toBe('Tasks')
    const col = movedBoard(board, 'T/Todo', 'T/Next', true)
    expect(col.columns).toEqual(['Next', 'Done'])
    expect(col.cards).toEqual({ Next: ['b.md', 'a.md'] })
    expect(movedBoard(board, 'T/Todo/a.md', 'T/Todo/c.md', false).cards.Todo).toEqual(['b.md', 'c.md'])
    expect(movedBoard(board, 'Other/x.md', 'Other/y.md', false)).toBe(board)
  })

  it('places cards: reordered in their column, or moved into another', () => {
    const board = newBoard('T')
    const data = boardColumns(board, files)
    const same = placeCard(board, data, 'T/Todo/b.md', 'Todo', 0)
    expect(same.to).toBeNull()
    expect(same.board.cards.Todo).toEqual(['b.md', 'a.md'])
    const moved = placeCard(board, data, 'T/Done/2025/old.md', 'Todo', 1)
    expect(moved.to).toBe('T/Todo/old.md')
    expect(moved.board.cards).toEqual({ Todo: ['a.md', 'old.md', 'b.md'], Done: [] })
    expect(placeCard(board, data, 'T/Todo/a.md', LOOSE, 0).to).toBe('T/a.md')
    expect(placeCard(board, data, 'T/loose.md', 'Empty', 0).to).toBe('T/Empty/loose.md')
  })

  it('reorders columns', () => {
    const board = newBoard('T')
    expect(moveColumn(board, boardColumns(board, files), 'Todo', 0).columns).toEqual(['Todo', 'Done', 'Empty'])
  })

  it('gives the notes in its folder the keys they lack', () => {
    const remote = { 'T/a.md': { sha: 's1', mode: '100644' }, 'T/b.png': { sha: 's2', mode: '100644' }, 'U/c.md': { sha: 's3', mode: '100644' } }
    const texts = { s1: '# A\n', s3: '# C\n' }
    const ch = withBoardKeys(add(empty(), remote, 'T/new.md', '---\ndescription: x\n---\n'), remote, 'T', ['description'], sha => sha === null ? '' : texts[sha])
    expect(ch.edits['T/a.md']).toBe('---\ndescription:\n---\n# A\n')
    expect(ch.edits['T/new.md']).toBe('---\ndescription: x\n---\n')
    expect(Object.keys(ch.edits).sort()).toEqual(['T/a.md', 'T/new.md'])
  })
})
