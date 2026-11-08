// The emoji that stands for a file or folder in place of its type icon (Emoji in a file's or folder's ⋯). Kept in the
// repo like the locks: `.folio/icons.json`, { "icons": { "Life/a.md": "📝", "Life": "🌱" } }. It's how Folio shows a
// file, not what it says: deleting .folio only brings the type icons back. A file or folder whose own name starts with an
// emoji shows it as its icon (and the name without it) until one is chosen; "" is a chosen "no emoji".

import { movedMap, removedMap } from './pathMap.js'

export const ICONS_PATH = '.folio/icons.json'

// One emoji at the start of a name: a flag, or a pictograph with its modifiers, joiners and variation selectors
const LEADING = /^(?:\p{Regional_Indicator}{2}|[\p{Extended_Pictographic}\p{Emoji_Presentation}][\p{Emoji_Modifier}️‍\p{Extended_Pictographic}\p{Emoji_Presentation}]*)/u

// The icons a file's text holds: {} for no file (undefined), null for text that can't be read (nothing is shown from
// it, and it's never saved over)
export function parseIcons(text) {
  if (text === undefined) return {}
  try {
    const data = JSON.parse(text)?.icons
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    return Object.fromEntries(Object.entries(data).filter(([p, e]) => p && typeof e === 'string'))
  } catch {
    return null
  }
}

export const serializeIcons = icons =>
  JSON.stringify({ icons: Object.fromEntries(Object.entries(icons).sort(([a], [b]) => a.localeCompare(b))) }, null, 2) + '\n'

// The emoji a name starts with, or ''
export const leadingEmoji = name => name.match(LEADING)?.[0] ?? ''

// `name` without the emoji it starts with (and the space after it); a name that is only an emoji stays as it is
export function withoutEmoji(name) {
  const rest = name.replace(LEADING, '').trimStart()
  return rest || name
}

const baseOf = path => path.split('/').pop()

// What `path` shows as its icon: its chosen emoji, else the one its name starts with; '' for none
export const iconOf = (icons, path) => path in icons ? icons[path] : leadingEmoji(baseOf(path))

// `icons` with `emoji` for `path`; '' takes it out, or, when the name starts with one, says "none"
export function withIcon(icons, path, emoji) {
  const rest = Object.fromEntries(Object.entries(icons).filter(([p]) => p !== path))
  if (emoji) return { ...rest, [path]: emoji }
  return leadingEmoji(baseOf(path)) ? { ...rest, [path]: '' } : rest
}

// `icons` after the file or folder (`isDir`) at `from` moved to `to`: the icons go with what they were chosen for
export const movedIcons = movedMap

// `icons` without the file or folder (`isDir`) at `path`, deleted: a new one there starts with its type icon
export const removedIcons = removedMap
