// Files locked against editing (Lock in a note's or card's ⋯): Folio shows them but doesn't change what's in them
// (their text, title, description, properties, ticks; a card's column, day, Mark as done and Remove). Renaming,
// moving and duplicating stay. Kept in the repo like the views: `.folio/locks.json`, { "paths": ["Life/a.md", …] }.
// It's how Folio treats a file, not what the file says: deleting .folio unlocks everything and loses nothing.

export const LOCKS_PATH = '.folio/locks.json'

// The locked paths a file's text holds: [] for no file (undefined), null for text that can't be read (nothing is
// locked from it, and it's never saved over)
export function parseLocks(text) {
  if (text === undefined) return []
  try {
    const data = JSON.parse(text)
    if (!Array.isArray(data?.paths)) return null
    return [...new Set(data.paths.filter(p => typeof p === 'string' && p))]
  } catch {
    return null
  }
}

export const serializeLocks = paths => JSON.stringify({ paths: [...paths].sort() }, null, 2) + '\n'

// `paths` with `path` locked, or unlocked when it was
export const toggledLock = (paths, path) => paths.includes(path) ? paths.filter(p => p !== path) : [...paths, path]

const within = (p, path, isDir) => p === path || (isDir && p.startsWith(path + '/'))

// `paths` after the file or folder (`isDir`) at `from` moved to `to`: what was locked in it stays locked where it went
export const movedLocks = (paths, from, to, isDir) => paths.map(p => within(p, from, isDir) ? to + p.slice(from.length) : p)

// `paths` without the file or folder (`isDir`) at `path`, deleted: a new file there starts unlocked
export const removedLocks = (paths, path, isDir) => paths.filter(p => !within(p, path, isDir))
