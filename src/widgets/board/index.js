import { Kanban, Columns } from '@phosphor-icons/react'
import { displayName } from '@/lib/files.js'
import Board from './Board.jsx'
import BoardSetup from './BoardSetup.jsx'
import { boardPath, boardTitle, parseBoard, serializeBoard, movedBoard, boardColumns, isCard, looseName, LOOSE } from './board.js'
import { placeCardVia } from './useBoard.js'

// The board widget (Kanban): see board.js. Its settings are .folio/boards/<id>.json.
export default {
  type: 'board',
  label: 'Board',
  icon: Kanban,
  Widget: Board,
  Setup: BoardSetup,
  title(id, { config, repoName }) {
    const file = config.read(boardPath(id))
    const board = file.ready && file.text !== undefined ? parseBoard(file.text) : null
    return board ? boardTitle(board, repoName) : 'Board'
  },
  // Its shown columns (No status first, when it has cards) and their cards, in their order
  tree(id, services) {
    const file = services.config.read(boardPath(id))
    const board = file.ready && file.text !== undefined ? parseBoard(file.text) : null
    const data = board && boardColumns(board, services.files, services.notes)
    if (!data || data.missing) return []
    const all = [...(data.loose.length ? [{ key: LOOSE, name: looseName(board), cards: data.loose }] : []), ...data.columns.filter(c => !board.hidden.includes(c.name))]
    return all.map(c => ({
      key: `${id}:${c.key}`, name: c.name, icon: Columns,
      children: c.cards.map(card => ({ key: card.path, name: displayName(card.path), path: card.path })),
    }))
  },
  // Its folder and card order follow renames and moves
  moved(ch, id, from, to, isDir, { config }) {
    const text = config.readIn(ch, boardPath(id))
    const board = typeof text === 'string' ? parseBoard(text) : null
    if (!board) return ch
    const moved = serializeBoard(movedBoard(board, from, to, isDir))
    return moved === serializeBoard(board) ? ch : config.write(boardPath(id), moved)(ch)
  },
  // The columns an open note can move to when it's a card of this board: { columns: [{ key, name }] shown,
  // column: the note's key, onSelect(key) }, else null
  fileMoves(id, path, services) {
    const file = services.config.read(boardPath(id))
    const board = file.ready && file.text !== undefined ? parseBoard(file.text) : null
    const data = board && boardColumns(board, services.files, services.notes)
    if (!data || data.missing || !services.canEdit) return null
    const all = [{ key: LOOSE, name: looseName(board), cards: data.loose }, ...data.columns]
    const current = all.find(c => c.cards.some(card => card.path === path))
    if (!current) return null
    const columns = all.filter(c => c.key !== LOOSE || c.cards.length).map(c => ({ ...c, hidden: board.hidden.includes(c.name) }))
    return {
      columns, column: current.key,
      onSelect: key => placeCardVia(services, id, board, data, path, key, all.find(c => c.key === key).cards.filter(c => c.path !== path).length),
    }
  },
  // Where a note's property values come from on its page when it's a card of this board: the whole board
  // ({ name, includes(path) }), so a value used in one column is offered in every other; the property it's grouped by
  // comes back when the note is saved without it (`required`), and its hidden columns (`hidden`: property → values, offered too, marked); else null
  valueScope(id, path, services) {
    const file = services.config.read(boardPath(id))
    const board = file.ready && file.text !== undefined ? parseBoard(file.text) : null
    const inBoard = p => isCard(board, p)
    return board && inBoard(path) ? { name: 'this board', includes: inBoard, required: [board.group], hidden: { [board.group]: board.hidden } } : null
  },
  removed: (ch, id, { config }) => config.erase(boardPath(id))(ch),
}
