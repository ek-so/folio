import { boardPath, parseBoard, serializeBoard, boardColumns, placeCard, moveColumn, emptyColumn } from './board.js'
import { fileItem, withNoteKeys } from '@/lib/folderNotes.js'
import { useFolderNotes } from '@/hooks/useFolderNotes.js'
import { DESCRIPTION } from '@/lib/frontmatter.js'

// A card dropped at `index` in `column`: the order is saved, and a card dropped in
// another column moves its file there (a taken name is refused, as a toast). Used by the
// board's drops and its menus, and by an open card's file menu (index.js).
export function placeCardVia(services, id, board, data, path, column, index) {
  const { board: next, to } = placeCard(board, data, path, column, index)
  if (to && !services.move(fileItem(path), to.slice(0, Math.max(to.lastIndexOf('/'), 0)))) return
  services.update(services.config.write(boardPath(id), serializeBoard(next)))
}

// Board `id` as its widget shows and changes it, through the app's `services`:
// `ready` (its settings are read), `board` (null when they can't be), `data`
// (boardColumns), and what the board can do. Every change goes through
// the app's own pipeline (services.update and its file actions).
export function useBoard(id, services) {
  const { config, update, files } = services
  const file = config.read(boardPath(id))
  const board = file.ready && file.text !== undefined ? parseBoard(file.text) : null
  const data = board && boardColumns(board, files)
  const save = next => update(config.write(boardPath(id), serializeBoard(next)))
  const notes = useFolderNotes(services, board ? board.folder : null)

  return {
    ready: file.ready,
    board,
    data,
    // A card dropped at `index` in `column`: the order is saved, and a card dropped in
    // another column moves its file there (a taken name is refused, as a toast)
    placeCard: (path, column, index) => placeCardVia(services, id, board, data, path, column, index),
    moveColumn: (name, index) => save(moveColumn(board, data, name, index)),
    // The properties cards show; a newly chosen one is added, empty, to the board's notes that lack it
    setProperties(keys) {
      const added = keys.filter(k => !board.properties.includes(k))
      update(ch => {
        const next = config.write(boardPath(id), serializeBoard({ ...board, properties: keys }))(ch)
        return added.length ? withNoteKeys(next, services.remoteFiles, board.folder, added, services.remoteText) : next
      })
    },
    // The columns shown (`shown`: names); the others are hidden (still listed in the Columns sheet)
    showColumns: shown => save({ ...board, hidden: data.columns.map(c => c.name).filter(n => !shown.includes(n)) }),
    // A column's folder opens in the view, like File manager (← comes back)
    openColumn: column => services.openFolder(column.path),
    // What its notes do (hooks/useFolderNotes.js): property keys and values, a card's title, description and removal
    ...notes,
    // The property `from` renamed `to` in every note of the board (and on its cards, and in its settings)
    renameProperty: (from, to) => notes.renameProperty(from, to,
      config.write(boardPath(id), serializeBoard({ ...board, properties: board.properties.map(k => k === from ? to : k) }))),
    // The property `key`, with its value, out of every note of the board (confirmed first)
    removeProperty: key => notes.removeProperty(key,
      config.write(boardPath(id), serializeBoard({ ...board, properties: board.properties.filter(k => k !== key) }))),
    // A column named `name`, right away (an error message, or null)
    addColumn: name => services.createFolder(board.folder, name),
    // A new card starts with the board's properties, empty; the board stays open
    newCard: folder => services.newNote(folder, { keys: [DESCRIPTION, ...board.properties], stay: true, titled: true }),
    renameColumn: (column, name) => services.rename({ name: column.name, path: column.path, type: 'dir' }, name),
    // With its files, or after moving them right into the board's folder (No status)
    deleteColumn(column, keepCards) {
      if (keepCards) services.moveAll(emptyColumn(board, column.path, files))
      services.remove({ name: column.name, path: column.path, type: 'dir' })
    },
  }
}
