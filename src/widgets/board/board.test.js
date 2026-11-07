import { describe, it, expect } from 'vitest'
import { parseBoard, serializeBoard, newBoard, boardColumns, movedBoard, placeCard, moveColumn, cardStatus, columnNameError, addedColumn, renamedColumn, removedColumn, LOOSE } from './board.js'

const note = status => `---\nstatus: ${status}\n---\n# N\n`
const files = ['T/b.md', 'T/a.md', 'T/old.md', 'T/loose.md', 'T/pic.png', 'T/sub/deep.md', 'T/.gitkeep', 'T/_index.md', 'Other/x.md']
const notes = { 'T/b.md': note('Todo'), 'T/a.md': note('Todo'), 'T/old.md': note('Done'), 'T/loose.md': '# L\n', 'T/sub/deep.md': note('Todo') }

describe('board', () => {
  it('reads its settings, or nothing from bad text', () => {
    expect(parseBoard('nope')).toBeNull()
    expect(parseBoard('{}')).toBeNull()
    const b = { ...newBoard('T'), columns: ['Done'] }
    expect(parseBoard(serializeBoard(b))).toEqual(b)
    expect(parseBoard(serializeBoard({ ...b, properties: ['status', 'project'] })).properties).toEqual(['project'])
  })

  it('reads a card\'s status: its first value, or none', () => {
    expect(cardStatus(note('Todo'))).toBe('Todo')
    expect(cardStatus('---\nstatus: [a, b]\n---\n')).toBe('a')
    expect(cardStatus('---\nstatus:\n---\n')).toBe(LOOSE)
    expect(cardStatus(undefined)).toBe(LOOSE)
  })

  it('has a column per status of the files right in its folder, the rest in No status', () => {
    const { columns, loose, missing } = boardColumns(newBoard('T'), files, notes)
    expect(columns.map(c => c.name)).toEqual(['Done', 'Todo'])
    expect(columns[0].cards).toEqual([{ key: 'old.md', path: 'T/old.md' }])
    expect(columns[1].cards.map(c => c.key)).toEqual(['a.md', 'b.md'])
    expect(loose.map(c => c.path)).toEqual(['T/loose.md', 'T/pic.png'])
    expect(missing).toBe(false)
    expect(boardColumns(newBoard('Gone'), files, notes).missing).toBe(true)
  })

  it('keeps saved columns, even empty, then follows the saved order, the rest by name', () => {
    const board = { ...newBoard('T'), columns: ['Todo', 'Empty'], cards: { Todo: ['b.md'] } }
    const { columns } = boardColumns(board, files, notes)
    expect(columns.map(c => c.name)).toEqual(['Todo', 'Empty', 'Done'])
    expect(columns[0].cards.map(c => c.key)).toEqual(['b.md', 'a.md'])
    expect(columns[1].cards).toEqual([])
  })

  it('keeps its order when things are renamed', () => {
    const board = { ...newBoard('T'), columns: ['Todo'], cards: { Todo: ['b.md', 'a.md'] } }
    expect(movedBoard(board, 'T', 'Tasks', true).folder).toBe('Tasks')
    expect(movedBoard(board, 'T/a.md', 'T/c.md', false).cards.Todo).toEqual(['b.md', 'c.md'])
    expect(movedBoard(board, 'T/a.md', 'T/sub/a.md', false)).toBe(board)
    expect(movedBoard(board, 'Other/x.md', 'Other/y.md', false)).toBe(board)
  })

  it('places cards: reordered in their column, or given another column\'s status', () => {
    const board = newBoard('T')
    const data = boardColumns(board, files, notes)
    const same = placeCard(board, data, 'T/b.md', 'Todo', 0)
    expect(same.status).toBeNull()
    expect(same.board.cards.Todo).toEqual(['b.md', 'a.md'])
    const moved = placeCard(board, data, 'T/old.md', 'Todo', 1)
    expect(moved.status).toBe('Todo')
    expect(moved.board.cards).toEqual({ Todo: ['a.md', 'old.md', 'b.md'], Done: [] })
    expect(placeCard(board, data, 'T/a.md', LOOSE, 0).status).toBe(LOOSE)
  })

  it('reorders, adds, renames and removes columns', () => {
    const board = { ...newBoard('T'), hidden: ['Todo'], cards: { Todo: ['b.md', 'a.md'] } }
    const data = boardColumns(board, files, notes)
    expect(moveColumn(board, data, 'Todo', 0).columns).toEqual(['Todo', 'Done'])
    expect(columnNameError(data, 'Done')).toMatch(/already/)
    expect(columnNameError(data, ' ')).toMatch(/name/)
    expect(columnNameError(data, 'Done', 'Done')).toBeNull()
    expect(addedColumn(board, data, 'Next').columns).toEqual(['Done', 'Todo', 'Next'])
    const renamed = renamedColumn(board, data, 'Todo', 'Doing')
    expect(renamed.columns).toEqual(['Done', 'Doing'])
    expect(renamed.hidden).toEqual(['Doing'])
    expect(renamed.cards).toEqual({ Doing: ['b.md', 'a.md'] })
    const removed = removedColumn({ ...board, columns: ['Done', 'Todo'] }, 'Todo')
    expect(removed).toEqual({ ...board, columns: ['Done'], hidden: [], cards: {} })
  })
})
