import { LOCKS_PATH, parseLocks, serializeLocks, toggledLock, movedLocks, removedLocks } from '../lib/locks.js'
import { useConfigFile } from './useConfigFile.js'

// The files locked against editing (lib/locks.js), from the config (hooks/useConfig.js): `isLocked(path)`,
// `canEdit` (read and readable, so it's never overwritten), and changes (ch => ch) for `update`, alone or in the
// same step as a move or delete: `toggle(path)`, `moved(from, to, isDir)`, `removed(path, isDir)`.
// Until the file is read nothing counts as locked.
export function useLocks(config) {
  const { value: paths, change } = useConfigFile(config, LOCKS_PATH, parseLocks, serializeLocks)
  return {
    isLocked: path => !!paths?.includes(path),
    canEdit: !!paths,
    toggle: path => change(list => toggledLock(list, path)),
    moved: (from, to, isDir) => change(list => movedLocks(list, from, to, isDir)),
    removed: (path, isDir) => change(list => removedLocks(list, path, isDir)),
  }
}
