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

// The note's properties as { key: value }
export const properties = text => Object.fromEntries((frontMatter(text)?.props ?? []).map(p => [p.key, p.value]))

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
