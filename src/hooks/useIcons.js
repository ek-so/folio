import { createContext, useContext } from 'react'
import { ICONS_PATH, parseIcons, serializeIcons, iconOf, withIcon, movedIcons, removedIcons } from '../lib/icons.js'

// The emoji icons of files and folders (lib/icons.js), from the config (hooks/useConfig.js): `iconOf(path)` ('' for none),
// `canEdit` (read and readable, so it's never overwritten), and changes (ch => ch) for `update`, alone or in the same
// step as a move or delete: `set(path, emoji)`, `moved(from, to, isDir)`, `removed(path, isDir)`.
// Until the file is read every file shows its own type icon.
export function useIcons(config) {
  const file = config.read(ICONS_PATH)
  const icons = file.ready ? parseIcons(file.text) : null
  const change = edit => ch => {
    const text = config.readIn(ch, ICONS_PATH)
    const now = text === null ? null : parseIcons(text)
    if (!now) return ch
    const next = edit(now)
    return serializeIcons(next) === serializeIcons(now) ? ch : config.write(ICONS_PATH, serializeIcons(next))(ch)
  }
  return {
    iconOf: path => icons ? iconOf(icons, path) : '',
    canEdit: !!icons,
    set: (path, emoji) => change(list => withIcon(list, path, emoji)),
    moved: (from, to, isDir) => change(list => movedIcons(list, from, to, isDir)),
    removed: (path, isDir) => change(list => removedIcons(list, path, isDir)),
  }
}

// What App shares so every icon and menu reaches it: `iconOf(path)`, and `onSet(path, emoji)` (undefined while it
// can't be saved)
export const IconsContext = createContext({ iconOf: () => '', onSet: undefined })
export const useIconsContext = () => useContext(IconsContext)
