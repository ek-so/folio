// Sync's merge of what changed both on this device and on GitHub since this device last had the file (`conflicts` in
// changes.js), keeping as much as it can: nothing is overwritten and nothing is thrown away.
//   A text file edited on both sides: merged line by line (`mergeText`): lines changed on one side only take that change;
//   lines changed on both sides keep both versions, this device's first, then GitHub's (a deleted line the other side
//   changed is kept). In a note's front matter a property changed on both sides keeps this device's value, and GitHub's
//   lines go into the note right under the front matter, so the properties stay valid.
//   Removed on one side, changed on the other: the changed one stays.
//   Moved here, changed on GitHub: GitHub's content, at the new place.
//   Other files (an image, a PDF) changed on both sides: GitHub's keeps its name, this device's is added next to it as
//   "name (this device).ext".
import { virtualFiles, discard, add, upload, freePath, splitName } from './changes.js'

// A text's lines, without the empty one after a last line break
const lines = text => text === '' ? [] : text.replace(/\n$/, '').split('\n')

// Pairs [i, j] of equal lines a[i] === b[j], a longest such sequence in order (the same lines at both ends are matched
// first, so a long note with a small change is quick)
function matches(a, b) {
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length, endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB-- }
  const n = endA - start, m = endB - start
  const table = new Uint32Array((n + 1) * (m + 1)) // table[i][j]: longest from a[start + i], b[start + j] on
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * (m + 1) + j] = a[start + i] === b[start + j]
        ? table[(i + 1) * (m + 1) + j + 1] + 1
        : Math.max(table[(i + 1) * (m + 1) + j], table[i * (m + 1) + j + 1])
    }
  }
  const pairs = []
  for (let i = 0; i < start; i++) pairs.push([i, i])
  for (let i = 0, j = 0; i < n && j < m;) {
    if (a[start + i] === b[start + j]) { pairs.push([start + i, start + j]); i++; j++ }
    else if (table[(i + 1) * (m + 1) + j] >= table[i * (m + 1) + j + 1]) i++
    else j++
  }
  for (let k = 0; k < a.length - endA; k++) pairs.push([endA + k, endB + k])
  return pairs
}

const same = (a, b) => a.length === b.length && a.every((line, i) => line === b[i])

// `base` (lines) changed into `local` and into `remote`: the merged lines. Between the lines all three still share, a
// part changed on one side only takes that side's; changed on both (differently), `both(local, remote)` (default: both,
// this device's first). `clashed()` is called for each such part
export function mergeLines(base, local, remote, both = (l, r) => [...l, ...r], clashed = () => {}) {
  const toLocal = new Map(matches(base, local))
  const toRemote = new Map(matches(base, remote))
  const out = []
  let i = 0, l = 0, r = 0
  const part = (bEnd, lEnd, rEnd) => {
    const b = base.slice(i, bEnd), lo = local.slice(l, lEnd), re = remote.slice(r, rEnd)
    if (same(lo, b)) out.push(...re)
    else if (same(re, b) || same(lo, re)) out.push(...lo)
    else { clashed(); out.push(...both(lo, re)) }
  }
  for (let k = 0; k < base.length; k++) {
    if (!toLocal.has(k) || !toRemote.has(k)) continue
    const lk = toLocal.get(k), rk = toRemote.get(k)
    if (lk < l || rk < r) continue
    part(k, lk, rk)
    out.push(base[k])
    i = k + 1; l = lk + 1; r = rk + 1
  }
  part(base.length, local.length, remote.length)
  return out
}

// A note's front matter lines (between its "---" lines; null without any) and the rest of its text
function splitNote(text) {
  const match = /^---\n([\s\S]*?)\n?---(?:\n|$)/.exec(text)
  return match ? [lines(match[1]), text.slice(match[0].length)] : [null, text]
}

// Front matter lines as its properties, in order: Map key → its lines (the "key: value" line and any lines under it,
// such as a list's "  - item"; lines before the first key go under '')
function properties(fm) {
  const props = new Map()
  let key = ''
  for (const line of fm ?? []) {
    const named = /^([^\s#:][^:]*):/.exec(line)
    if (named) key = named[1].trim()
    props.set(key, [...(props.get(key) ?? []), line])
  }
  return props
}

// Front matter merged property by property: one changed on one side takes that change (removed too); changed on both,
// this device's stays and GitHub's lines go to `moved` (a property removed on one side and changed on the other is kept).
// The lines, in this device's order, then what GitHub added
function mergeProperties(baseFm, localFm, remoteFm, moved, clash) {
  const base = properties(baseFm), local = properties(localFm), remote = properties(remoteFm)
  const key = v => v?.join('\n')
  const out = []
  for (const name of new Set([...local.keys(), ...remote.keys()])) {
    const b = key(base.get(name)), l = key(local.get(name)), r = key(remote.get(name))
    if (l === b) { if (r !== undefined) out.push(...remote.get(name)) }
    else if (r === b || l === r) { if (l !== undefined) out.push(...local.get(name)) }
    else if (l === undefined) out.push(...remote.get(name))
    else if (r === undefined) out.push(...local.get(name))
    else { clash(); out.push(...local.get(name)); moved.push(...remote.get(name)) }
  }
  return out
}

// `base` changed into `local` (this device) and into `remote` (GitHub): one text with both, as described on top.
// { text, clashed }: `clashed` when some lines were changed on both sides
export function mergeText(base, local, remote) {
  let clashed = false
  const clash = () => { clashed = true }
  const [baseFm, baseBody] = splitNote(base), [localFm, localBody] = splitNote(local), [remoteFm, remoteBody] = splitNote(remote)
  const body = mergeLines(lines(baseBody), lines(localBody), lines(remoteBody), undefined, clash)
  const end = local.endsWith('\n') || remote.endsWith('\n') ? '\n' : '' // a last line break, as either had
  const join = list => list.length ? list.join('\n') + end : ''
  if (localFm === null && remoteFm === null) return { text: join(body), clashed }
  const moved = [] // GitHub's front matter lines that clashed: into the note, under the front matter
  const fm = mergeProperties(baseFm, localFm, remoteFm, moved, clash)
  return { text: `---\n${fm.length ? fm.join('\n') + '\n' : ''}---\n${join([...moved, ...body])}`, clashed }
}

// `path` with " (this device)" before its extension
const thisDevicePath = path => {
  const slash = path.lastIndexOf('/') + 1
  const [name, ext] = splitName(path.slice(slash))
  return `${path.slice(0, slash)}${name} (this device)${ext}`
}

// `ch` with the conflicts at `origs` (changes.js `conflicts`) resolved against GitHub's `files`, as described on top;
// `texts`: { orig: { base, remote } } for each one edited here as text (its text when this device last had it, '' for one
// made here, and GitHub's now, null when it's gone). { changes, merged: the paths it merged or kept both of }. Afterwards
// none of them is a conflict: each is rebased on GitHub's file, or made anew where GitHub has none
export function resolveConflicts(ch, files, origs, texts) {
  let next = ch
  const merged = []
  for (const orig of origs) {
    const target = orig in next.moves ? next.moves[orig] : orig
    const remote = files[orig] ?? null
    const rebase = () => { next = { ...next, base: { ...next.base, [orig]: remote.sha } } }
    if (target === null) { // removed here: GitHub's (changed, or removed too) stays
      next = discard(next, [orig])
      continue
    }
    const localUpload = next.uploads[orig]
    const baseSha = next.base[orig]
    if (!remote) { // gone from GitHub, kept here: made anew where it is here
      const text = next.edits[orig]
      next = discard(next, [orig])
      next = text !== undefined ? add(next, files, target, text) : upload(next, files, target, localUpload ?? baseSha)
      continue
    }
    if (orig in next.edits) { // text edited on both sides
      const { text } = mergeText(texts[orig]?.base ?? '', next.edits[orig], texts[orig]?.remote ?? '')
      rebase()
      next = { ...next, edits: { ...next.edits, [orig]: text } }
      merged.push(target)
    } else if (localUpload !== undefined) { // another file on both sides: GitHub's keeps the name, this device's goes beside it
      const uploads = Object.fromEntries(Object.entries(next.uploads).filter(([key]) => key !== orig))
      next = baseSha === null ? discard(next, [orig]) : { ...next, uploads }
      if (baseSha !== null) rebase()
      next = upload(next, files, freePath(next, virtualFiles(files, next), thisDevicePath(target)), localUpload)
      merged.push(target)
    } else rebase() // only moved here: GitHub's content at its new place
  }
  return { changes: next, merged }
}
