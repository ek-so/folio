import { Kanban } from '@phosphor-icons/react'
import Board from './Board.jsx'
import BoardSetup from './BoardSetup.jsx'
import { boardPath, parseBoard, serializeBoard, movedBoard, boardColumns, LOOSE } from './board.js'
import { placeCardVia } from './useBoard.js'

// The board widget (Kanban): see board.js. Its settings are .folio/boards/<id>.json.
export default {
  type: 'board',
  label: 'Board',
  icon: Kanban,
  Widget: Board,
  Setup: BoardSetup,
  // Its folder, columns and order follow renames and moves
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
    const data = board && boardColumns(board, services.files)
    if (!data || data.missing || !services.canEdit) return null
    const all = [{ key: LOOSE, name: 'No status', cards: data.loose }, ...data.columns]
    const current = all.find(c => c.cards.some(card => card.path === path))
    if (!current) return null
    const columns = all.filter(c => c.key === current.key || (c.key === LOOSE ? c.cards.length : !board.hidden.includes(c.name)))
    return {
      columns, column: current.key,
      onSelect: key => placeCardVia(services, id, board, data, path, key, all.find(c => c.key === key).cards.filter(c => c.path !== path).length),
    }
  },
  removed: (ch, id, { config }) => config.erase(boardPath(id))(ch),
}
