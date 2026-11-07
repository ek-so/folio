import { boardPath, parseBoard, serializeBoard, boardColumns, placeCard, moveColumn, columnNameError, addedColumn, renamedColumn, removedColumn, groupedBy, LOOSE } from './board.js'
import { fileItem, withNoteKeys } from '@/lib/folderNotes.js'
import { useFolderNotes } from '@/hooks/useFolderNotes.js'
import { editNote } from '@/lib/changes.js'
import { DESCRIPTION, withValue } from '@/lib/frontmatter.js'

// `ch` with the board's grouping property of each note in `paths` set to `status` (LOOSE: kept, empty)
const withStatus = (services, board, paths, status) => ch => paths.reduce(
  (next, path) => editNote(next, services.remoteFiles, path, t => withValue(t, board.group, status), services.remoteText), ch)

// A card dropped at `index` in `column`: the order is saved, and a card dropped in
// another column gets that column as its grouping property's value, in the same step. Used by the
// board's drops and its menus, and by an open card's file menu (index.js).
export function placeCardVia(services, id, board, data, path, column, index) {
  const { board: next, status } = placeCard(board, data, path, column, index)
  services.update(ch => {
    const saved = services.config.write(boardPath(id), serializeBoard(next))(ch)
    return status === null ? saved : withStatus(services, board, [path], status)(saved)
  })
}

// Board `id` as its widget shows and changes it, through the app's `services`:
// `ready` (its settings are read), `board` (null when they can't be), `data`
// (boardColumns), and what the board can do. Every change goes through
// the app's own pipeline (services.update and its file actions).
export function useBoard(id, services) {
  const { config, update, files } = services
  const file = config.read(boardPath(id))
  const board = file.ready && file.text !== undefined ? parseBoard(file.text) : null
  const data = board && boardColumns(board, files, services.notes)
  const write = next => config.write(boardPath(id), serializeBoard(next))
  const save = next => update(write(next))
  const notes = useFolderNotes(services, board ? board.folder : null)

  return {
    ready: file.ready,
    board,
    data,
    // A card dropped at `index` in `column`: the order is saved, and a card dropped in
    // another column gets its status
    placeCard: (path, column, index) => placeCardVia(services, id, board, data, path, column, index),
    moveColumn: (name, index) => save(moveColumn(board, data, name, index)),
    // The properties cards show; a newly chosen one is added, empty, to the board's notes that lack it
    setProperties(keys) {
      const added = keys.filter(k => !board.properties.includes(k))
      update(ch => {
        const next = write({ ...board, properties: keys })(ch)
        return added.length ? withNoteKeys(next, services.remoteFiles, board.folder, added, services.remoteText) : next
      })
    },
    // The columns shown (`shown`: names); the others are hidden (still listed in the Columns sheet)
    showColumns: shown => save({ ...board, hidden: data.columns.map(c => c.name).filter(n => !shown.includes(n)) }),
    // What its notes do (hooks/useFolderNotes.js): property keys and values, a card's title, description and removal
    ...notes,
    // The keys its notes have, besides the description and the grouping one
    propertyKeys: () => notes.propertyKeys().filter(k => k !== board.group),
    keyError: key => key === board.group ? `The columns are grouped by “${key}”.` : notes.keyError(key),
    // Every key it could group by: its notes' keys (the grouping one too), by name
    groupKeys: () => [...new Set([board.group, ...notes.propertyKeys()])].sort(),
    // Grouped by the property `key` (its own columns, kept from before); the notes that lack it get it, empty
    // Another folder (its own is gone), its notes given the grouping property and a description, empty, as at setup
    setFolder: folder => update(ch => withNoteKeys(write({ ...board, folder })(ch), services.remoteFiles, folder, [board.group, DESCRIPTION], services.remoteText)),
    groupBy: key => update(ch => withNoteKeys(write(groupedBy(board, key))(ch), services.remoteFiles, board.folder, [key], services.remoteText)),
    // The property `from` renamed `to` in every note of the board (and on its cards, and in its settings)
    // (its columns, if it was ever grouped by, follow)
    renameProperty(from, to) {
      if (to === board.group) return `The columns are grouped by “${to}”.`
      const { [from]: layout, ...groups } = board.groups
      return notes.renameProperty(from, to, write({ ...board, properties: board.properties.map(k => k === from ? to : k), groups: layout ? { ...groups, [to]: layout } : groups }))
    },
    // The property `key`, with its value, out of every note of the board (confirmed first), and its columns
    removeProperty(key) {
      const groups = Object.fromEntries(Object.entries(board.groups).filter(([k]) => k !== key))
      notes.removeProperty(key, write({ ...board, properties: board.properties.filter(k => k !== key), groups }))
    },
    // A column named `name`, right away, at the end (an error message, or null)
    addColumn(name) {
      const error = columnNameError(data, name)
      if (!error) save(addedColumn(board, data, name))
      return error
    },
    // A new card starts with the column as its grouping property's value and the board's properties, empty; the board stays open
    newCard: column => services.newNote(board.folder, {
      keys: [board.group, DESCRIPTION, ...board.properties], values: column === LOOSE ? {} : { [board.group]: column }, stay: true, titled: true,
    }),
    // The column's name and the grouping property of every card in it (an error message, or null)
    renameColumn(column, name) {
      if (name === column.name) return null
      const error = columnNameError(data, name, column.name)
      if (error) return error
      update(ch => withStatus(services, board, column.cards.map(c => c.path), name)(write(renamedColumn(board, data, column.name, name))(ch)))
      return null
    },
    // With its cards' files, or after emptying their grouping property (No status)
    deleteColumn(column, keepCards) {
      if (keepCards) update(ch => withStatus(services, board, column.cards.map(c => c.path), LOOSE)(write(removedColumn(board, column.name))(ch)))
      else {
        save(removedColumn(board, column.name))
        services.removeAll(column.cards.map(c => fileItem(c.path)))
      }
    },
  }
}
