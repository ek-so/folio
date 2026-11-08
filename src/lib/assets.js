// The Assets page lists the files that aren't notes (images, PDFs, uploads…), newest added first. When a file was added
// isn't in git, so Folio notes it when it's uploaded here: `.folio/assets.json`, { "added": { "pics/a.png": "2026-11-08T10:00:00.000Z" } }.
// It only orders the list (how Folio shows files): deleting .folio keeps every file, the list just falls back to path order,
// and files added elsewhere count as oldest.
import { movedMap, removedMap } from './pathMap.js'
import { isConfigPath } from './viewsConfig.js'

export const ASSETS_PATH = '.folio/assets.json'

// When files were added, from a file's text: {} for no file (undefined), null for text that can't be read (never saved over)
export function parseAdded(text) {
  if (text === undefined) return {}
  try {
    const data = JSON.parse(text)?.added
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    return Object.fromEntries(Object.entries(data).filter(([p, t]) => p && typeof t === 'string'))
  } catch {
    return null
  }
}

export const serializeAdded = added =>
  JSON.stringify({ added: Object.fromEntries(Object.entries(added).sort(([a], [b]) => a.localeCompare(b))) }, null, 2) + '\n'

// `added` with `path` added at `time` (an ISO string)
export const withAdded = (added, path, time) => ({ ...added, [path]: time })

export const movedAdded = movedMap
export const removedAdded = removedMap

const isAsset = path => !path.endsWith('.md') && !isConfigPath(path) && !path.startsWith('.archive/') && path.split('/').pop() !== '.gitkeep'

// The paths in `paths` that are assets, newest added first, those with no time after them by path
export function assetList(paths, added) {
  return paths.filter(isAsset).sort((a, b) => (added[b] ?? '').localeCompare(added[a] ?? '') || a.localeCompare(b))
}
