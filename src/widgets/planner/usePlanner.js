import { plannerPath, parsePlanner, serializePlanner, keyDay, DATE } from './planner.js'
import { formatDate } from '@/lib/dates.js'
import { DESCRIPTION } from '@/lib/frontmatter.js'
import { withNoteKeys } from '@/lib/folderNotes.js'
import { useFolderNotes } from '@/hooks/useFolderNotes.js'

// Planner `id` as its widget shows and changes it, through the app's `services`: `ready` (its
// settings are read), `planner` (null when they can't be), `missing` (its folder is gone), and what the
// planner can do with its notes (hooks/useFolderNotes.js) and its settings. Every change goes through
// the app's own pipeline (services.update and its file actions).
export function usePlanner(id, services) {
  const { config, update, folders } = services
  const file = config.read(plannerPath(id))
  const planner = file.ready && file.text !== undefined ? parsePlanner(file.text) : null
  const notes = useFolderNotes(services, planner ? planner.folder : null)
  const write = next => config.write(plannerPath(id), serializePlanner(next))

  return {
    ready: file.ready,
    planner,
    missing: !!planner && planner.folder !== '' && !folders.includes(planner.folder),
    ...notes,
    cards: notes.entries.map(([path, text]) => ({ path, text })),
    // A new card on the day `key`: its date is that day and it starts with the planner's properties, empty; the planner stays open
    newCard: key => services.newNote(planner.folder, { keys: [DATE, DESCRIPTION, ...planner.properties], values: { [DATE]: formatDate(keyDay(key)) }, stay: true, titled: true }),
    // The properties cards show besides the date; a newly chosen one is added, empty, to the notes that lack it
    setProperties(keys) {
      const added = keys.filter(k => !planner.properties.includes(k))
      update(ch => {
        const next = write({ ...planner, properties: keys })(ch)
        return added.length ? withNoteKeys(next, services.remoteFiles, planner.folder, added, services.remoteText) : next
      })
    },
    // The property `from` renamed `to` in every note of the folder (and in its settings); refused when a note already has `to`
    renameProperty: (from, to) => notes.renameProperty(from, to,
      write({ ...planner, properties: planner.properties.map(k => k === from ? to : k) })),
    // The property `key`, with its value, out of every note of the folder (confirmed first)
    removeProperty: key => notes.removeProperty(key, write({ ...planner, properties: planner.properties.filter(k => k !== key) })),
  }
}
