// A note's properties: the front matter block at its very top, as in Obsidian
// and Jekyll:
//   ---
//   status: In progress
//   tags: [work, urgent]
//   ---
// Only flat `key: value` lines are read (a value can be a [list] or `- item`
// lines under its key); anything else in the block is kept as it is.

// The property shown as a note's description: plain text under its title, never a badge
export const DESCRIPTION = 'description'

const OPEN = /^---[ \t]*\r?\n/
const CLOSE = /^(?:---|\.\.\.)[ \t]*$/
const KEY = /^([^\s:#-][^:]*?):(?:[ \t]+(.*?))?[ \t]*$/
const ITEM = /^[ \t]+-[ \t]+(.*?)[ \t]*$/

const unquote = s => /^(["']).*\1$/.test(s) ? s.slice(1, -1) : s
const parseValue = s => {
  if (!s) return ''
  if (s.startsWith('[') && s.endsWith(']')) return s.slice(1, -1).split(',').map(x => unquote(x.trim())).filter(Boolean)
  return unquote(s)
}

// { props: [{ key, value }], end } for the note's front matter (`value`: a
// string, '' when empty, or a list of strings; `end`: where the block's closing
// line ends), or null when the note has none
export function frontMatter(text) {
  const open = text.match(OPEN)
  if (!open) return null
  const props = []
  let at = open[0].length
  while (at <= text.length) {
    const nl = text.indexOf('\n', at)
    const lineEnd = nl === -1 ? text.length : nl
    const line = text.slice(at, lineEnd).replace(/\r$/, '')
    if (CLOSE.test(line)) return { props, end: nl === -1 ? text.length : nl + 1, close: at }
    const item = line.match(ITEM)
    const last = props.at(-1)
    if (item && last) last.value = [...(Array.isArray(last.value) ? last.value : last.value ? [last.value] : []), unquote(item[1])]
    else {
      const m = line.match(KEY)
      if (m) props.push({ key: m[1].trim(), value: parseValue(m[2]) })
    }
    if (nl === -1) break
    at = nl + 1
  }
  return null // never closed: not front matter
}

// Why `key` can't be a property name (one `withKeys` writes and `frontMatter` reads back), or null
export function keyNameError(key) {
  const m = /\n/.test(key) ? null : `${key}:`.match(KEY)
  return m && m[1].trim() === key ? null : 'A property name can\'t start with "-" or "#", or contain ":".'
}

// The note's properties as { key: value }
export const properties = text => Object.fromEntries((frontMatter(text)?.props ?? []).map(p => [p.key, p.value]))

// How many colors a property's badges can have (--tag-0 … in index.css)
export const PROPERTY_COLORS = 10

// The color (0 … PROPERTY_COLORS - 1) of a property's badges: the same one for
// a name everywhere. A hash, picked so that the usual names (type, priority,
// due date, status, tags, project, date, owner) all differ; others can share.
export const propertyColor = key => [...key].reduce((h, c) => (h * 111 + c.charCodeAt(0)) >>> 0, 7) % PROPERTY_COLORS

// A property's value as the strings to show (empty ones left out)
export const valueList = value => (Array.isArray(value) ? value : [value]).filter(v => v !== '' && v != null)

// `text` with every key of `keys` it doesn't have yet, empty, at the end of its
// front matter (a block is added on top when it has none). The rest is untouched.
export function withKeys(text, keys) {
  const fm = frontMatter(text)
  const have = new Set(fm?.props.map(p => p.key))
  const missing = [...new Set(keys)].filter(k => !have.has(k))
  if (!missing.length) return text
  const lines = missing.map(k => `${k}:\n`).join('')
  if (!fm) return `---\n${lines}---\n${text}`
  const before = text.slice(0, fm.close)
  return before + (before.endsWith('\n') ? '' : '\n') + lines + text.slice(fm.close)
}

// `text` without the properties `keys` (each line, with its `- item` lines);
// a block left empty goes too. The rest is untouched.
export function withoutKeys(text, keys) {
  const fm = frontMatter(text)
  if (!fm || !fm.props.some(p => keys.includes(p.key))) return text
  const open = text.match(OPEN)[0].length
  const lines = text.slice(open, fm.close).split(/(?<=\n)/)
  const kept = []
  let dropping = false
  for (const line of lines) {
    const bare = line.replace(/\r?\n$/, '')
    if (dropping && (ITEM.test(bare) || /^[ \t]+\S/.test(bare))) continue
    const m = bare.match(KEY)
    dropping = !!m && keys.includes(m[1].trim())
    if (!dropping) kept.push(line)
  }
  if (!kept.some(l => l.trim())) return text.slice(fm.end)
  return text.slice(0, open) + kept.join('') + text.slice(fm.close)
}

const quoted = s => /^[["'#]/.test(s) ? `"${s}"` : s

// `text` with the property `key` set to `value` (a string, or a list of strings
// for a property that has a list: `[a, b]` stays inline, `- item` lines stay
// lines, and a value with "," or brackets goes on lines), added when the note
// lacks it. Empty strings are dropped; no value leaves `key:`. The rest is untouched.
export function withValue(text, key, value) {
  const base = withKeys(text, [key])
  const fm = frontMatter(base)
  const open = base.match(OPEN)[0].length
  const lines = base.slice(open, fm.close).split(/(?<=\n)/)
  const bare = l => l.replace(/\r?\n$/, '')
  const at = lines.findIndex(l => bare(l).match(KEY)?.[1].trim() === key)
  let end = at + 1
  while (end < lines.length && (ITEM.test(bare(lines[end])) || /^[ \t]+\S/.test(bare(lines[end])))) end++
  const eol = lines[at].match(/\r?\n$/)?.[0] ?? '\n'
  const wasItems = lines.slice(at + 1, end).some(l => ITEM.test(bare(l)))
  let out
  if (Array.isArray(value)) {
    const items = value.map(v => v.trim()).filter(Boolean)
    if (!items.length) out = `${key}:${eol}`
    else if (!wasItems && items.every(i => !/[,[\]]/.test(i))) out = `${key}: [${items.map(quoted).join(', ')}]${eol}`
    else out = `${key}:${eol}` + items.map(i => `  - ${quoted(i)}${eol}`).join('')
  } else {
    const v = value.trim()
    out = `${key}:${v ? ' ' + quoted(v) : ''}${eol}`
  }
  lines.splice(at, end - at, out)
  return base.slice(0, open) + lines.join('') + base.slice(fm.close)
}

// The values the property `key` has in `texts` (notes), each once, sorted
export function valuesOf(texts, key) {
  const seen = new Set()
  for (const text of texts) {
    const value = properties(text)[key]
    if (value !== undefined) valueList(value).forEach(v => seen.add(v))
  }
  return [...seen].sort((a, b) => a.localeCompare(b))
}

// `text` with the property `from` named `to` (its value kept), or as it is
// when it has no `from`
export function renameKey(text, from, to) {
  const fm = frontMatter(text)
  if (!fm?.props.some(p => p.key === from)) return text
  const open = text.match(OPEN)[0].length
  const block = text.slice(open, fm.close).split(/(?<=\n)/).map(line => {
    const m = line.replace(/\r?\n$/, '').match(KEY)
    return m && m[1].trim() === from ? line.replace(m[1], to) : line
  })
  return text.slice(0, open) + block.join('') + text.slice(fm.close)
}

// `text` with its front matter turned into blank lines of the same length, so
// the preview skips it while every offset still matches the note
export function blankFrontMatter(text) {
  const fm = frontMatter(text)
  return fm ? text.slice(0, fm.end).replace(/[^\n]/g, ' ') + text.slice(fm.end) : text
}

// A note's title: its `title` property, else its first "# heading" (outside
// the front matter), else `fallback` (its file name)
export function noteTitle(text, fallback) {
  const fm = frontMatter(text)
  const title = fm?.props.find(p => p.key === 'title')?.value
  if (typeof title === 'string' && title.trim()) return title.trim()
  const heading = text.slice(fm?.end ?? 0).match(/^ {0,3}#[ \t]+(.+?)[ \t#]*$/m)
  return heading ? heading[1] : fallback
}
