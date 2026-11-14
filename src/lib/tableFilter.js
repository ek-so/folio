// Filtering a note's tables in the preview by the words their cells share. Nothing is saved: a filter only hides rows
// while the note is open.

// Tables with fewer body rows than this get no filters
export const MIN_ROWS = 3

// A cell's words, lowercase, as a Set (letters and digits in any script; one-letter words left out)
export const cellWords = text => new Set((text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(w => w.length > 1))

// The words used in more than one row of a column (`cells`: each row's text), as the filter's choices:
// [{ key (lowercase), label (as first written), count (rows using it) }], most used first, then A–Z
export function repeatedWords(cells) {
  const found = new Map()
  for (const text of cells) {
    const forms = new Map((text.match(/[\p{L}\p{N}]+/gu) ?? []).map(w => [w.toLowerCase(), w]).reverse())
    for (const key of cellWords(text)) {
      const seen = found.get(key)
      if (seen) seen.count++
      else found.set(key, { key, label: forms.get(key), count: 1 })
    }
  }
  return [...found.values()].filter(w => w.count > 1)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

// Whether a row (`cells`: its cells' text) passes `filter` ({ column: [ticked keys] }): in every filtered column, its
// cell has one of the ticked words
export const rowShown = (cells, filter) =>
  Object.entries(filter).every(([col, keys]) => !keys.length || keys.some(k => cellWords(cells[col] ?? '').has(k)))
