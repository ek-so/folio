import { ASSETS_PATH, parseAdded, serializeAdded, withAdded, movedAdded, removedAdded } from '../lib/assets.js'

// When files were added here (lib/assets.js), from the config (hooks/useConfig.js): `added` ({} until read), and changes
// (ch => ch) for `update`, alone or in the same step as an upload, move or delete: `record(path)`, `moved(from, to, isDir)`,
// `removed(path, isDir)`. A file that can't be read is never saved over.
export function useAssets(config) {
  const file = config.read(ASSETS_PATH)
  const added = file.ready ? parseAdded(file.text) : null
  const change = edit => ch => {
    const text = config.readIn(ch, ASSETS_PATH)
    const now = text === null ? null : parseAdded(text)
    if (!now) return ch
    const next = edit(now)
    return serializeAdded(next) === serializeAdded(now) ? ch : config.write(ASSETS_PATH, serializeAdded(next))(ch)
  }
  return {
    added: added ?? {},
    record: path => change(list => withAdded(list, path, new Date().toISOString())),
    moved: (from, to, isDir) => change(list => movedAdded(list, from, to, isDir)),
    removed: (path, isDir) => change(list => removedAdded(list, path, isDir)),
  }
}
