import { Kanban } from '@phosphor-icons/react'
import Board from './Board.jsx'
import BoardSetup from './BoardSetup.jsx'
import { boardPath, parseBoard, serializeBoard, movedBoard } from './board.js'

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
  removed: (ch, id, { config }) => config.erase(boardPath(id))(ch),
}
