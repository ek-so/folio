// The colors picked for property values (Edit on a value in a badge's
// popover), kept in the repo like the views: `.folio/colors.json`,
// { "<property>": { "<value>": 0 … PROPERTY_COLORS - 1 } }. A value without one
// has the color its name gives it (valueColors in lib/frontmatter.js).
// The file is a normal local change, committed by Sync, and never shows in
// File manager, the folder tree or Search (`isConfigPath`).
import { PROPERTY_COLORS } from './frontmatter.js'

export const TAG_COLORS_PATH = '.folio/colors.json'

// The colors a file's text holds: {} for no file (undefined), null for text
// that can't be read (nothing is shown from it, and it is never saved over)
export function parseTagColors(text) {
  if (text === undefined) return {}
  try {
    const data = JSON.parse(text)
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    const colors = {}
    for (const [key, values] of Object.entries(data)) {
      if (!values || typeof values !== 'object' || Array.isArray(values)) continue
      const kept = Object.entries(values).filter(([, c]) => Number.isInteger(c) && c >= 0 && c < PROPERTY_COLORS)
      if (kept.length) colors[key] = Object.fromEntries(kept)
    }
    return colors
  } catch {
    return null
  }
}

export const serializeTagColors = colors => JSON.stringify(colors, null, 2) + '\n'

// `colors` with `value` of the property `key` given `color`
export const withTagColor = (colors, key, value, color) => ({ ...colors, [key]: { ...colors[key], [value]: color } })
