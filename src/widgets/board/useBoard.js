import { boardPath, parseBoard, serializeBoard, boardColumns, placeCard, moveColumn, withBoardKeys, editNotes } from './board.js'
import { DESCRIPTION, frontMatter, withoutKeys, renameKey } from '@/lib/frontmatter.js'

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
  // The properties of every note in the board's folder, as [key, …] per note (on this device)
  const prefix = board?.folder ? board.folder + '/' : ''
  const noteKeys = board ? Object.entries(services.notes).filter(([p]) => p.startsWith(prefix))
    .map(([, text]) => frontMatter(text)?.props.map(p => p.key) ?? []) : []
  // A name that can't be a property: an error message, or null
  const keyError = key => /[:\n]/.test(key) ? 'A property name can\'t contain ":".' : key === DESCRIPTION ? 'The description is always shown.' : null
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
    // The keys its notes have, besides the description, by name
    propertyKeys: () => [...new Set(noteKeys.flat())].filter(k => k !== DESCRIPTION).sort(),
    // How many of its notes have the property `key`
    notesWith: key => noteKeys.filter(keys => keys.includes(key)).length,
    keyError,
    // The property `from` renamed `to` in every note of the board (and on its cards); refused
    // when a note already has `to`
    renameProperty(from, to) {
      const error = keyError(to) ?? (noteKeys.some(keys => keys.includes(from) && keys.includes(to)) ? `Some notes already have “${to}”.` : null)
      if (error) return error
      update(ch => editNotes(config.write(boardPath(id), serializeBoard({ ...board, properties: board.properties.map(k => k === from ? to : k) }))(ch),
        services.remoteFiles, board.folder, t => renameKey(t, from, to), services.remoteText))
      return null
    },
    // The property `key`, with its value, out of every note of the board (confirmed first)
    removeProperty(key) {
      update(ch => editNotes(config.write(boardPath(id), serializeBoard({ ...board, properties: board.properties.filter(k => k !== key) }))(ch),
        services.remoteFiles, board.folder, t => withoutKeys(t, [key]), services.remoteText))
    },
    // A column named `name`, right away (an error message, or null)
    addColumn: name => services.createFolder(board.folder, name),
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
