import { boardPath, parseBoard, serializeBoard, boardColumns, placeCard, moveColumn, withBoardKeys } from './board.js'
import { DESCRIPTION } from '@/lib/frontmatter.js'

// Board `id` as its widget shows and changes it, through the app's `services`:
// `ready` (its settings are read), `board` (null when they can't be), `data`
// (boardColumns), `title`, and what the board can do. Every change goes through
// the app's own pipeline (services.update and its file actions).
export function useBoard(id, services) {
  const { config, update, files, repoName } = services
  const file = config.read(boardPath(id))
  const board = file.ready && file.text !== undefined ? parseBoard(file.text) : null
  const data = board && boardColumns(board, files)
  const save = next => update(config.write(boardPath(id), serializeBoard(next)))
  const folderOf = path => path.slice(0, Math.max(path.lastIndexOf('/'), 0))
  const fileItem = path => ({ path, name: path.slice(path.lastIndexOf('/') + 1), type: 'file' })

  return {
    ready: file.ready,
    board,
    data,
    title: board ? board.folder.split('/').pop() || repoName : 'Board',
    // A card dropped at `index` in `column`: the order is saved, and a card dropped in
    // another column moves its file there (a taken name is refused, as a toast)
    placeCard(path, column, index) {
      const { board: next, to } = placeCard(board, data, path, column, index)
      if (to && !services.move(fileItem(path), folderOf(to))) return
      save(next)
    },
    moveColumn: (name, index) => save(moveColumn(board, data, name, index)),
    // The properties cards show; a newly chosen one is added, empty, to the board's notes that lack it
    setProperties(keys) {
      const added = keys.filter(k => !board.properties.includes(k))
      update(ch => {
        const next = config.write(boardPath(id), serializeBoard({ ...board, properties: keys }))(ch)
        return added.length ? withBoardKeys(next, services.remoteFiles, board.folder, added, services.remoteText) : next
      })
    },
    // The columns shown (`shown`: names); the others are hidden, still listed in the board's ⋯
    showColumns: shown => save({ ...board, hidden: data.columns.map(c => c.name).filter(n => !shown.includes(n)) }),
    // A hidden column's folder opens in the view, like File manager (← comes back)
    openColumn: column => services.openFolder(column.path),
    newColumn: () => services.newFolder(board.folder),
    // A new card starts with the board's properties, empty; the board stays open
    newCard: folder => services.newNote(folder, { keys: [DESCRIPTION, ...board.properties], stay: true }),
    renameColumn: (column, name) => services.rename({ name: column.name, path: column.path, type: 'dir' }, name),
    // With its files, or after moving them right into the board's folder (No status)
    deleteColumn(column, keepCards) {
      if (keepCards) services.moveAll(files.filter(p => p.startsWith(column.path + '/') && !p.endsWith('/.gitkeep')), board.folder)
      services.remove({ name: column.name, path: column.path, type: 'dir' })
    },
  }
}
