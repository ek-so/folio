// Search in what notes say: `searchNotes(texts, query, skip?)`, `texts` = { path: text } (every note on the device, local
// edits included: `notes` of hooks/useLinkIndex.js). A note whose text holds the query (any case) is a hit, with a
// snippet around its first match: { path, before, match, after }, in path order; `skip(path)` leaves notes out (the ones
// already found by name). At most `limit` hits; a query under two letters finds nothing.

const BEFORE = 24
const AFTER = 70

const flat = text => text.replace(/\s+/g, ' ')

export function searchNotes(texts, query, skip = () => false, limit = 20) {
  const q = flat(query.trim()).toLowerCase()
  if (q.length < 2) return []
  const hits = []
  for (const path of Object.keys(texts).sort((a, b) => a.localeCompare(b))) {
    if (skip(path)) continue
    const text = flat(texts[path])
    const at = text.toLowerCase().indexOf(q)
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
