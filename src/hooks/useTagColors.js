import { TAG_COLORS_PATH, parseTagColors, serializeTagColors, withTagColor } from '../lib/tagColors.js'

// The colors picked for property values (lib/tagColors.js), from the config
// (hooks/useConfig.js): `colors` ({ key: { value: color } }, empty until read),
// `canEdit` (read and readable, so it's never overwritten) and `set(key, value,
// color)`, a change (ch => ch) for `update`, alone or with the note edits of a rename.
export function useTagColors(config) {
  const file = config.read(TAG_COLORS_PATH)
  const parsed = file.ready ? parseTagColors(file.text) : null
  const set = (key, value, color) => ch => {
    const text = config.readIn(ch, TAG_COLORS_PATH)
    const colors = text === null ? null : parseTagColors(text)
    return colors ? config.write(TAG_COLORS_PATH, serializeTagColors(withTagColor(colors, key, value, color)))(ch) : ch
  }
  return { colors: parsed ?? {}, canEdit: !!parsed, set }
}
