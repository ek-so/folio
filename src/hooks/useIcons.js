import { createContext, useContext } from 'react'
import { ICONS_PATH, parseIcons, serializeIcons, iconOf, withIcon, withAdoptedIcon, movedIcons, removedIcons } from '../lib/icons.js'
import { useConfigFile } from './useConfigFile.js'

// The emoji icons of files and folders (lib/icons.js), from the config (hooks/useConfig.js): `iconOf(path)` ('' for none),
// `canEdit` (read and readable, so it's never overwritten), `key` (changes with the icons), and changes (ch => ch) for
// `update`, alone or in the same step as a move or delete: `set(path, emoji)`, `adopt(path, emoji)`, `moved(from, to, isDir)`, `removed(path, isDir)`.
// Until the file is read a name's own emoji still shows.
export function useIcons(config) {
  const { value: icons, key, change } = useConfigFile(config, ICONS_PATH, parseIcons, serializeIcons)
  return {
    iconOf: path => iconOf(icons ?? {}, path),
    canEdit: !!icons,
    key,
    set: (path, emoji) => change(list => withIcon(list, path, emoji)),
    adopt: (path, emoji) => change(list => withAdoptedIcon(list, path, emoji)), // a name's emoji as its icon, unless one is chosen
    moved: (from, to, isDir) => change(list => movedIcons(list, from, to, isDir)),
    removed: (path, isDir) => change(list => removedIcons(list, path, isDir)),
  }
}

// What App shares so every icon and menu reaches it: `iconOf(path)`, and `onSet(path, emoji)` (undefined while it
// can't be saved)
export const IconsContext = createContext({ iconOf: () => '', onSet: undefined })
export const useIconsContext = () => useContext(IconsContext)
