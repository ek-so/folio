// Search in what notes say: `searchNotes(texts, query, skip?)`, `texts` = { path: text } (every note on the device, local
// edits included: `notes` of hooks/useLinkIndex.js). A note whose text holds the query (any case) is a hit, with a
// snippet around its first match: { path, before, match, after }, in path order; `skip(path)` leaves notes out (the ones
// already found by name). At most `limit` hits; a query under two letters finds nothing.

const BEFORE = 24
const AFTER = 70

const flat = text => text.replace(/\s+/g, ' ')

// What's worked out for a note once, kept while its text stays the same: the text on one line, and in lower case
const cache = new Map() // path -> { text, line, lower }
const prepared = (path, text) => {
  let e = cache.get(path)
  if (e?.text !== text) { const line = flat(text); e = { text, line, lower: line.toLowerCase() }; cache.set(path, e) }
  return e
}

// The paths of a `texts` object in order, worked out once per object (`texts` is the link index's, which only changes
// when a note does)
const orders = new WeakMap()
const ordered = texts => {
  let paths = orders.get(texts)
  if (!paths) { paths = Object.keys(texts).sort((a, b) => a.localeCompare(b)); orders.set(texts, paths) }
  return paths
}

export function searchNotes(texts, query, skip = () => false, limit = 20) {
  const q = flat(query.trim()).toLowerCase()
  if (q.length < 2) return []
  const hits = []
  for (const path of ordered(texts)) {
    if (skip(path)) continue
    const { line: text, lower } = prepared(path, texts[path])
    const at = lower.indexOf(q)
    if (at < 0) continue
    const from = Math.max(0, at - BEFORE)
    const end = Math.min(text.length, at + q.length + AFTER)
    hits.push({
      path,
      before: (from > 0 ? '…' : '') + text.slice(from, at),
      match: text.slice(at, at + q.length),
      after: text.slice(at + q.length, end) + (end < text.length ? '…' : ''),
    })
    if (hits.length >= limit) break
  }
  return hits
}
