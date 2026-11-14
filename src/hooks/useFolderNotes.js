import { useMemo } from 'react'
import { isTechnical, editNotes, withNoteKeys } from '@/lib/folderNotes.js'
import { editNote } from '@/lib/changes.js'
import { DESCRIPTION, frontMatter, withoutKeys, renameKey, keyNameError, withValue, valueActions } from '@/lib/frontmatter.js'

// What a widget (board, planner) does with the notes of its `folder` (null: it
// has none, e.g. its settings can't be read), through the app's `services`; every
// change goes through the app's own pipeline (services.update and its file actions).
// `edit(text, first)` below is `editNotes`: `first(ch)` is applied to the changes before the notes
// (a widget's own settings file goes in the same step).
export function useFolderNotes(services, folder) {
  const { update } = services
  const prefix = folder ? folder + '/' : ''
  // Every note of the folder (on this device; no technical files), [path, text]
  const entries = useMemo(() => folder !== null ? Object.entries(services.notes)
    .filter(([p]) => p.startsWith(prefix) && !isTechnical(p.slice(prefix.length))) : [], [services.notes, prefix, folder === null])
  const texts = useMemo(() => entries.map(([, text]) => text), [entries])
  // With no folder there are no notes to edit (never the whole repo)
  const editAll = (edit, first = ch => ch) => {
    if (folder === null) return
    update(ch => editNotes(first(ch), services.remoteFiles, folder, edit, services.remoteText))
  }
  // Its values' actions (lib/frontmatter.js `valueActions`) over every note, in one step
  const valuesCache = useMemo(() => new Map(), [texts])
  const values = valueActions(texts, editAll, services.tagColors.set, valuesCache)
  const noteKeys = useMemo(() => texts.map(text => frontMatter(text)?.props.map(p => p.key) ?? []), [texts])
  // A name that can't be a property here: an error message, or null
  const keyError = key => keyNameError(key) ?? (key === DESCRIPTION ? 'The description is always shown.' : null)
  const editOne = (path, edit) => update(ch => editNote(ch, services.remoteFiles, path, edit, services.remoteText))

  return {
    entries,
    // The keys its notes have, besides the description, by name
    propertyKeys: () => [...new Set(noteKeys.flat())].filter(k => k !== DESCRIPTION).sort(),
    // How many of its notes have the property `key`
    notesWith: key => noteKeys.filter(keys => keys.includes(key)).length,
    keyError,
    // What its notes have as the property `key`, to choose from, and how many have `value`
    valuesOf: values.options,
    valueCount: values.count,
    // The property `key` of the card `path` set to `value` (a string, or a list of them)
    setProperty: (path, key, value) => editOne(path, t => withValue(t, key, value)),
    // Only for a note on this device (`canEditText`: its description can be edited)
    canEditText: path => services.notes[path] !== undefined,
    // The card's description (kept, empty when emptied: every note of a widget has one)
    setDescription: (path, text) => editOne(path, t => withValue(t, DESCRIPTION, text)),
    // `from` renamed `to` (and given `color`), or `value` taken out, in the property `key` in every note
    editValue: values.editValue,
    removeValue: values.removeValue,
    // The property `from` renamed `to` in every note (and on its cards), together with `first`; refused when a note already has `to`
    renameProperty(from, to, first) {
      const error = keyError(to) ?? (noteKeys.some(keys => keys.includes(from) && keys.includes(to)) ? `Some notes already have “${to}”.` : null)
      if (error) return error
      editAll(t => renameKey(t, from, to), first)
      return null
    },
    // The properties its cards show set to `keys` (from `shown`), together with `first` (its settings written): a newly
    // shown one is added, empty, to the notes that lack it
    showProperties(keys, shown, first) {
      const added = keys.filter(k => !shown.includes(k))
      update(ch => added.length && folder !== null ? withNoteKeys(first(ch), services.remoteFiles, folder, added, services.remoteText) : first(ch))
    },
    // The property `key`, with its value, out of every note (confirmed first), together with `first`
    removeProperty: (key, first) => editAll(t => withoutKeys(t, [key]), first),
    editAll,
  }
}
