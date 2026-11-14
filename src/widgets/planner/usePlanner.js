import { useMemo, useState } from 'react'
import { plannerPath, parsePlanner, serializePlanner, keyDay, droppedDate, doneNext, asCard, orderedDay, restoredDay, renamedProperty, removedProperty, DATE, REPEAT, ORDER, VIEWS } from './planner.js'
import { storage } from '@/lib/storage.js'
import { ONE_TIME } from './recurrence.js'
import { formatDate } from '@/lib/dates.js'
import { properties } from '@/lib/frontmatter.js'
import { markedDone } from '@/lib/archive.js'
import { editNotes } from '@/lib/folderNotes.js'
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
  const cards = useMemo(() => notes.entries.map(([path, text]) => ({ path, text })), [notes.entries])
  const write = next => config.write(plannerPath(id), serializePlanner(next))
  const save = next => update(write(next))
  // An edit of the planner's settings as they are when it runs (later changes kept), not as this render read them
  const change = edit => update(ch => {
    const text = config.readIn(ch, plannerPath(id))
    const now = typeof text === 'string' ? parsePlanner(text) : null
    return now ? write(edit(now))(ch) : ch
  })
  // Calendar or list: this device's choice, kept here (never in .folio, which holds no state of a screen)
  const [view, setViewState] = useState(() => VIEWS.includes(storage.getPlannerView(id)) ? storage.getPlannerView(id) : VIEWS[0])

  return {
    ready: file.ready,
    planner,
    missing: !!planner && planner.folder !== '' && !folders.includes(planner.folder),
    ...notes,
    cards,
    // A new card on the day `key`: its description (empty), date (that day) and repeat (one-time), then the planner's properties, empty; the planner stays open
    // A new card on the day `key`; `pickDate`: the sheet also asks for its date, starting on that day
    newCard: (key, pickDate = false) => services.newNote(planner.folder, { keys: [...ORDER, ...planner.properties], values: { [DATE]: formatDate(keyDay(key)), [REPEAT]: ONE_TIME }, stay: true, date: pickDate ? { key: DATE, value: keyDay(key) } : undefined }),
    // Mark as done on `today` (a key): a repeating card moves on to its next time (doneNext; its time of day kept); any other,
    // or one past its last time, gets `status: done` and today as `archived` and moves into .archive/ (lib/archive.js).
    // { next: the day it moved to, or null when archived, undo() }, or null when the note isn't on this device
    markDone(path, today) {
      const text = notes.entries.find(([p]) => p === path)?.[1]
      if (text === undefined) return null
      const next = doneNext(text, today)
      if (next) {
        const old = properties(text)[DATE]
        notes.setProperty(path, DATE, formatDate(droppedDate(text, next)))
        return { next, undo: () => notes.setProperty(path, DATE, old) }
      }
      const archived = services.archive(path, markedDone)
      return { next: null, undo: () => services.unarchive(archived.to, path, archived.text ?? text) }
    },
    // Another folder (its own is gone), its notes made cards as when the planner was set up
    setFolder: folder => update(ch => editNotes(write({ ...planner, folder })(ch), services.remoteFiles, folder, asCard, services.remoteText)),
    // Calendar or list (planner.js VIEWS), remembered on this device
    view,
    setView: next => { setViewState(next); storage.setPlannerView(id, next) },
    // How a day's cards are ordered (planner.js SORTS, or a property's "property:<key>"); a manual order is kept for when it's picked again
    setSort: sort => save({ ...planner, sort }),
    // The day `key`'s cards dragged into the order `paths` (as of `today`): the planner sorts manually from now on. Returns
    // undo(), which puts back the sort and that day's order it had, keeping any other change made since
    reorderDay(key, paths, today) {
      const before = planner
      save(orderedDay(planner, key, paths, today, cards.map(c => c.path)))
      return () => change(now => restoredDay(now, before, key))
    },
    // The properties cards show besides the date; a newly chosen one is added, empty, to the notes that lack it
    setProperties: keys => notes.showProperties(keys, planner.properties, write({ ...planner, properties: keys })),
    // The property `from` renamed `to` in every note of the folder (and in its settings, its sort too); refused when a note already has `to`
    renameProperty: (from, to) => notes.renameProperty(from, to,
      write(renamedProperty(planner, from, to))),
    // The property `key`, with its value, out of every note of the folder (confirmed first); sorted by it, back to time
    removeProperty: key => notes.removeProperty(key, write(removedProperty(planner, key))),
  }
}
