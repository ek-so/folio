import { useMemo } from 'react'
import { boardPath, boardTitle, parseBoard, serializeBoard, boardColumns, placeCard, moveColumn, withBoardKeys, editNotes, emptyColumn, isTechnical } from './board.js'
import { editNote } from '@/lib/changes.js'
import { DESCRIPTION, frontMatter, withoutKeys, renameKey, keyNameError, withValue, withTitle, valueActions } from '@/lib/frontmatter.js'

// A card dropped at `index` in `column`: the order is saved, and a card dropped in
// another column moves its file there (a taken name is refused, as a toast). Used by the
// board's drops and its menus, and by an open card's file menu (index.js).
export function placeCardVia(services, id, board, data, path, column, index) {
  const { board: next, to } = placeCard(board, data, path, column, index)
  if (to && !services.move({ path, name: path.slice(path.lastIndexOf('/') + 1), type: 'file' }, to.slice(0, Math.max(to.lastIndexOf('/'), 0)))) return
  services.update(services.config.write(boardPath(id), serializeBoard(next)))
}

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
  // Every note of the board (on this device; no technical files), and its properties as [key, …] per note
  const prefix = board?.folder ? board.folder + '/' : ''
  const texts = useMemo(() => board ? Object.entries(services.notes)
    .filter(([p]) => p.startsWith(prefix) && !isTechnical(p.slice(prefix.length)))
    .map(([, text]) => text) : [], [services.notes, prefix, !!board])
  // Its values' actions (lib/frontmatter.js `valueActions`) over every note of the board, in one step
  const values = valueActions(texts, (edit, first = ch => ch) =>
    update(ch => editNotes(first(ch), services.remoteFiles, board.folder, edit, services.remoteText)), services.tagColors.set)
  const noteKeys = texts.map(text => frontMatter(text)?.props.map(p => p.key) ?? [])
  // A name that can't be a property here: an error message, or null
  const keyError = key => keyNameError(key) ?? (key === DESCRIPTION ? 'The description is always shown.' : null)
  const fileItem = path => ({ path, name: path.slice(path.lastIndexOf('/') + 1), type: 'file' })

  return {
    ready: file.ready,
    board,
    data,
    title: board ? boardTitle(board, repoName) : 'Board',
    // A card dropped at `index` in `column`: the order is saved, and a card dropped in
    // another column moves its file there (a taken name is refused, as a toast)
    placeCard: (path, column, index) => placeCardVia(services, id, board, data, path, column, index),
    moveColumn: (name, index) => save(moveColumn(board, data, name, index)),
    // The properties cards show; a newly chosen one is added, empty, to the board's notes that lack it
    setProperties(keys) {
      const added = keys.filter(k => !board.properties.includes(k))
      update(ch => {
        const next = config.write(boardPath(id), serializeBoard({ ...board, properties: keys }))(ch)
        return added.length ? withBoardKeys(next, services.remoteFiles, board.folder, added, services.remoteText) : next
      })
    },
    // The columns shown (`shown`: names); the others are hidden (still listed in the Columns sheet)
    showColumns: shown => save({ ...board, hidden: data.columns.map(c => c.name).filter(n => !shown.includes(n)) }),
    // A column's folder opens in the view, like File manager (← comes back)
    openColumn: column => services.openFolder(column.path),
    // The keys its notes have, besides the description, by name
    propertyKeys: () => [...new Set(noteKeys.flat())].filter(k => k !== DESCRIPTION).sort(),
    // How many of its notes have the property `key`
    notesWith: key => noteKeys.filter(keys => keys.includes(key)).length,
    keyError,
    // What the board's notes have as the property `key`, to choose from, and how many have `value`
    valuesOf: values.options,
    valueCount: values.count,
    // The property `key` of the card `path` set to `value` (a string, or a list of them)
    setProperty: (path, key, value) =>
      update(ch => editNote(ch, services.remoteFiles, path, t => withValue(t, key, value), services.remoteText)),
    // The card's title property (empty: taken out); only for a note on this device (`canTitle`)
    canTitle: path => services.notes[path] !== undefined,
    setTitle: (path, title) =>
      update(ch => editNote(ch, services.remoteFiles, path, t => withTitle(t, title), services.remoteText)),
    // The card's note deleted, like any delete (the app's: links and trails follow)
    deleteCard: path => services.remove(fileItem(path)),
    // `from` renamed `to` (and given `color`), or `value` taken out, in the property `key` in every note of the board
    editValue: values.editValue,
    removeValue: values.removeValue,
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
    newCard: folder => services.newNote(folder, { keys: [DESCRIPTION, ...board.properties], stay: true, titled: true }),
    renameColumn: (column, name) => services.rename({ name: column.name, path: column.path, type: 'dir' }, name),
    // With its files, or after moving them right into the board's folder (No status)
    deleteColumn(column, keepCards) {
      if (keepCards) services.moveAll(emptyColumn(board, column.path, files))
      services.remove({ name: column.name, path: column.path, type: 'dir' })
    },
  }
}
