import { ASSETS_PATH, parseAdded, serializeAdded, withAdded, movedAdded, removedAdded } from '../lib/assets.js'
import { useConfigFile } from './useConfigFile.js'

// When files were added here (lib/assets.js), from the config (hooks/useConfig.js): `added` ({} until read), and changes
// (ch => ch) for `update`, alone or in the same step as an upload, move or delete: `record(path)`, `moved(from, to, isDir)`,
// `removed(path, isDir)`. A file that can't be read is never saved over.
export function useAssets(config) {
  const { value, change } = useConfigFile(config, ASSETS_PATH, parseAdded, serializeAdded)
  return {
    added: value ?? {},
    record: path => change(list => withAdded(list, path, new Date().toISOString())),
    moved: (from, to, isDir) => change(list => movedAdded(list, from, to, isDir)),
    removed: (path, isDir) => change(list => removedAdded(list, path, isDir)),
  }
}
