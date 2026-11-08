import { marked } from 'marked'
import { blankFrontMatter, frontMatter, withValue } from './frontmatter.js'
import { displayName } from './files.js'
import { findDates, formatDate, dateLabel, isoDate } from './dates.js'

marked.setOptions({ breaks: true, gfm: true })

// Phones' smart punctuation turns "---" into "—-" (and "--" into "—").
// Treat a line of em dashes and hyphens worth 3+ hyphens as a divider.
const DASH_LINE = /^ {0,3}([—-]*—[—-]*)[ \t]*(?:\n+|$)/
marked.use({ extensions: [{
  name: 'dashDivider',
  level: 'block',
  start: src => src.match(/^ {0,3}[—-]*—[—-]*[ \t]*$/m)?.index,
  tokenizer(src) {
    const m = src.match(DASH_LINE)
    if (!m || [...m[1]].reduce((n, c) => n + (c === '—' ? 2 : 1), 0) < 3) return
    return { type: 'hr', raw: m[0] }
  },
}] })

// "text" followed by "---" is a divider, not a setext h2 heading ("===" still
// makes an h1). Done in the lexer, so block offsets keep matching the note.
const SETEXT = /^((?:[^\n]+\n)+?) {0,3}(=+|-+)[ \t]*(?:\n|$)/
marked.use({ tokenizer: {
  lheading(src) {
    const m = src.match(SETEXT)
    if (m?.[2][0] !== '-') return false
    // The lines above stay one paragraph; the "---" is lexed next, as <hr>
    const text = m[1].replace(/\n$/, '')
    return { type: 'paragraph', raw: m[1], text, tokens: this.lexer.inline(text) }
  },
} })

// GitHub alerts: "> [!NOTE]" (TIP, IMPORTANT, WARNING, CAUTION) on its own
// line becomes a colored callout, titled "Note", "Tip"…
const ALERT = /^\[!(note|tip|important|warning|caution)\][ \t]*(?:\n|$)/i
marked.use({ useNewRenderer: true, renderer: {
  blockquote({ text }) {
    const m = text.match(ALERT)
    if (!m) return false
    const body = this.parser.parse(marked.lexer(text.slice(m[0].length)))
    const type = m[1].toLowerCase()
    const title = type[0].toUpperCase() + type.slice(1)
    return `<blockquote class="callout callout-${type}">\n<p class="callout-title">${title}</p>\n${body}</blockquote>\n`
  },
} })

// Dates in the text (lib/dates.js; not in code or links) become date spots: an empty
// <time> the preview fills with a DateBadge, its label in `data-label`, what's typed in `data-raw`.
function splitDates(token) {
  const parts = []
  let last = 0
  const piece = text => ({ type: 'text', raw: text, text, escaped: token.escaped })
  for (const { start, end, date } of findDates(token.text)) {
    if (start > last) parts.push(piece(token.text.slice(last, start)))
    parts.push({ type: 'date', raw: token.text.slice(start, end), date })
    last = end
  }
  if (!parts.length) return [token]
  if (last < token.text.length) parts.push(piece(token.text.slice(last)))
  return parts
}

// Inline tokens with their text's dates turned into date tokens; links and code are left alone
const withDates = tokens => tokens.flatMap(t =>
  t.type === 'text' && !t.tokens ? splitDates(t)
    : t.tokens && t.type !== 'link' ? [{ ...t, tokens: withDates(t.tokens) }]
      : [t])

marked.use({
  extensions: [{
    name: 'date',
    renderer: ({ raw, date }) => `<time class="date-spot" datetime="${isoDate(date)}" data-label="${dateLabel(date)}" data-raw="${escapeAttr(raw)}"></time>`,
  }],
})

const escapeAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Where the preview shows plain text (where it shows dates as badges): [start, end] of each piece of `markdown`'s
// text, not in the front matter, code, links, images or HTML
function textRanges(markdown) {
  const ranges = []
  const KEEP = new Set(['code', 'codespan', 'html', 'link', 'image', 'def'])
  // `tokens` found in order in `src` (at `base` in the markdown) from `offset`; returns where it stopped
  const walk = (tokens, src, base, offset = 0) => {
    for (const t of tokens ?? []) {
      const at = src.indexOf(t.raw, offset)
      if (at === -1) continue
      offset = at + t.raw.length
      if (KEEP.has(t.type)) continue
      if (t.type === 'text' && !t.tokens) ranges.push([base + at, base + offset])
      else if (t.type === 'table') [...t.header, ...t.rows.flat()].reduce((o, cell) => walk(cell.tokens, t.raw, base + at, o), 0)
      else walk(t.items ?? t.tokens, t.raw, base + at)
    }
    return offset
  }
  const text = blankFrontMatter(markdown) // same length, positions stay
  walk(marked.lexer(text), text, 0)
  return ranges
}

// The markdown with every date written as "17 Oct 2026, 14:30", in its text and in its properties'
// values. Anything that isn't text in the preview (code, links, HTML) or in a value stays as it is
export function withFixedDates(markdown, now = new Date()) {
  return withFixedValues(withFixedText(markdown, now), now)
}

// The properties' values with their dates written in one form, as text (`withValue`: a list item
// that gets a "," moves its list onto `- item` lines, so it stays one value)
function withFixedValues(markdown, now) {
  let text = markdown
  for (const { key, value } of frontMatter(markdown)?.props ?? []) {
    const fix = v => v ? withFixedText(v, now) : v
    const next = Array.isArray(value) ? value.map(fix) : fix(value)
    if ([next].flat().some((v, i) => v !== [value].flat()[i])) text = withValue(text, key, next)
  }
  return text
}

// The text's (not the front matter's) dates written in one form, where the preview shows them
function withFixedText(markdown, now) {
  let out = ''
  let last = 0
  for (const { start, end, date } of dateSpans(markdown, now)) {
    out += markdown.slice(last, start) + formatDate(date)
    last = end
  }
  return out + markdown.slice(last)
}

// The dates in `markdown`'s text where the preview shows them as badges, in order: [{ start, end, date }]
export const dateSpans = (markdown, now = new Date()) => textRanges(markdown).flatMap(([from, to]) =>
  findDates(markdown.slice(from, to), now).map(d => ({ ...d, start: from + d.start, end: from + d.end })))

// `text` with the date at `span` (from dateSpans) written as `date` ({ year, month, day, hour?, minute? })
export const withDate = (text, span, date) => text.slice(0, span.start) + formatDate(date) + text.slice(span.end)

// A property's value as one date ({ year, month, day, hour?, minute? }) when that's all it is, else null
export function valueDate(value, now = new Date()) {
  const text = typeof value === 'string' ? value.trim() : ''
  const [found] = findDates(text, now)
  return found && found.start === 0 && found.end === text.length ? found.date : null
}

// One line of markdown as HTML (a property's value, such as a description), its dates as date spots
export const renderInline = text => marked.Parser.parseInline(withDates(marked.Lexer.lexInline(text)))

// Run on the lexed tokens (renderBlocks lexes and parses separately, so marked's own walkTokens doesn't run)
const addDates = token => {
  if (token.type === 'table') for (const cell of [...token.header, ...token.rows.flat()]) cell.tokens = withDates(cell.tokens)
  else if (token.tokens && ['paragraph', 'heading', 'text'].includes(token.type)) token.tokens = withDates(token.tokens)
}

// How many <details> a raw HTML token opens, minus how many it closes
const detailsDepth = raw => (raw.match(/<details[\s>]/gi) || []).length - (raw.match(/<\/details>/gi) || []).length

// HTML (unsanitized) where each top-level block is wrapped in
// <div data-src="start" data-len="length"> pointing at its markdown source.
// A <details> accordion (as on GitHub: <summary>, then markdown after a blank
// line, then </details>) is one block from its opening to its closing tag, so
// the browser doesn't close it early. The front matter (properties) isn't
// rendered: the preview shows it as badges.
export function renderBlocks(source) {
  const markdown = blankFrontMatter(source)
  const tokens = marked.lexer(markdown)
  marked.walkTokens(tokens, addDates)
  let offset = 0
  let html = ''
  let group = null // { start, end, tokens, depth } while inside <details>
  const emit = (start, end, parts) => {
    const part = marked.parser(Object.assign(parts, { links: tokens.links }))
    if (part) html += `<div data-src="${start}" data-len="${end - start}">${part}</div>`
  }
  for (const token of tokens) {
    const found = markdown.indexOf(token.raw, offset)
    const start = found === -1 ? offset : found
    offset = start + token.raw.length
    const depth = token.type === 'html' ? detailsDepth(token.raw) : 0
    if (group) {
      group.tokens.push(token)
      group.end = offset
      group.depth += depth
      if (group.depth <= 0) { emit(group.start, group.end, group.tokens); group = null }
      continue
    }
    if (depth > 0) { group = { start, end: offset, tokens: [token], depth }; continue }
    if (token.type === 'space') continue
    emit(start, offset, [token])
  }
  if (group) emit(group.start, group.end, group.tokens) // never closed: still one block
  return html
}

// Every markdown link in `source` (not images), in the order the preview shows them:
// [{ start, end, label, href, bare }]. `label`: the link text's markdown; `bare`: a URL
// written as is (https://… or <https://…>), not [label](url)
export function linkSpans(source) {
  const markdown = blankFrontMatter(source)
  const tokens = marked.lexer(markdown)
  const spans = []
  let offset = 0
  for (const token of tokens) {
    const start = markdown.indexOf(token.raw, offset)
    if (start === -1) continue
    offset = start + token.raw.length
    let at = start
    marked.walkTokens([token], t => {
      if (t.type !== 'link') return
      const found = markdown.indexOf(t.raw, at)
      if (found === -1 || found >= offset) return
      at = found + t.raw.length
      spans.push({ start: found, end: at, label: t.text, href: t.href, bare: !t.raw.startsWith('[') })
    })
  }
  return spans
}

// The markdown for a link named `name` to `url`; a bare URL stays bare while it has no other name
export function linkMarkdown(name, url, bare) {
  const u = url.trim()
  const n = name.trim()
  const dest = /[\s()<>]/.test(u) ? `<${u.replace(/[<>]/g, encodeURIComponent)}>` : u
  if (bare && dest === u && (!n || n === u)) return u
  return `[${n || u}](${dest})`
}

// A markdown link to `path` in the repo, from its root ("/notes/a.md"), so it works pasted in any note
// (and follows renames like any link), named after it
export const repoLink = path => linkMarkdown(displayName(path), '/' + path)

// `text` with the link at `span` replaced by `markdown`; '' takes the link out with
// one of the spaces around it
export function replaceLink(text, span, markdown) {
  let { start, end } = span
  if (!markdown && text[end] === ' ' && (start === 0 || /[ \n]/.test(text[start - 1]))) end++
  else if (!markdown && text[start - 1] === ' ' && /^[ \n]?$/.test(text[end] ?? '')) start--
  return text.slice(0, start) + markdown + text.slice(end)
}

// The first word (letters and digits) of a piece of text, rendered or markdown alike ("**Fix** it" and
// "Fix it" both give "Fix"): to check that rendered list items are the ones found in the markdown
export const firstWord = text => text.match(/[\p{L}\p{N}]+/u)?.[0] ?? ''

// The lists in a list block's markdown `raw`, nested ones too, in the order the preview
// renders them: [{ ordered, first, items: [{ start, end, word }] }] (`word`: its text's first, `firstWord`). An item runs from its marker
// line to the next marker that isn't nested in it (its sub-lists and blank lines are in it).
// A change of marker (- to *, 1. to 1)) starts another list, as in markdown.
const LIST_MARKER = /^([ \t]*)([-*+]|(\d{1,9})([.)]))(?:[ \t]+|$)/
export function listsIn(raw) {
  const lists = []
  const marks = [] // every item, in order: { item, content }
  const stack = [] // open lists: { list, indent, content, kind }
  let at = 0
  for (const line of raw.split('\n')) {
    const m = line.match(LIST_MARKER)
    if (m) {
      const indent = m[1].replace(/\t/g, '    ').length
      const kind = m[3] ? m[4] : m[2]
      while (stack.length && indent < stack.at(-1).indent) stack.pop()
      let top = stack.at(-1)
      if (top && indent < top.content && top.kind !== kind) { stack.pop(); top = null } // same level, another list
      if (!top || indent >= top.content) {
        const list = { ordered: Boolean(m[3]), first: m[3] ? Number(m[3]) : 1, items: [] }
        lists.push(list)
        top = { list, indent, kind }
        stack.push(top)
      }
      top.content = indent + Math.max(m[0].length - m[1].length, m[2].length + 1) // where its text starts
      const item = { start: at, end: raw.length, word: firstWord(line.slice(m[0].length).replace(/^\[[ xX]\][ \t]*/, '')) }
      top.list.items.push(item)
      for (const prev of marks) if (prev.item.end === raw.length && prev.item !== item && indent < prev.content) prev.item.end = at
      marks.push({ item, content: top.content })
    }
    at += line.length + 1
  }
  return lists
}

// `text` with the item at `from` of `list` (from listsIn, offsets into `text`) moved to `to`,
// its sub-items with it; the blank lines between items stay where they were and an ordered
// list is numbered again from its first number
export function moveListItem(text, list, from, to) {
  const { items } = list
  const parts = items.map(i => text.slice(i.start, i.end).match(/^([\s\S]*?)(\n*)$/))
  const bodies = parts.map(p => p[1])
  const [moved] = bodies.splice(from, 1)
  bodies.splice(to, 0, moved)
  const joined = bodies.map((body, k) => (list.ordered ? body.replace(/^([ \t]*)\d+/, (_, sp) => sp + (list.first + k)) : body) + parts[k][2]).join('')
  return text.slice(0, items[0].start) + joined + text.slice(items.at(-1).end)
}

// Offsets of each task checkbox's mark (the " " or "x" in "- [ ]") in a
// block's markdown, in order. Only a box opening a list item counts, not
// "[x]" further along in its text.
const TASK = /^[ \t>]*(?:[-*+]|\d+[.)])[ \t]+\[[ xX]\]/gm
export const taskOffsets = raw => [...raw.matchAll(TASK)].map(m => m.index + m[0].length - 2)

// { done, total } of a note's task checkboxes, outside its front matter and code fences
const FENCE = /^ {0,3}(`{3,}|~{3,})[\s\S]*?(?:^ {0,3}\1[ \t]*$|(?![\s\S]))/gm
export function taskProgress(text) {
  const marks = [...blankFrontMatter(text).replace(FENCE, '').matchAll(TASK)].map(m => m[0].at(-2))
  return { done: marks.filter(c => c !== ' ').length, total: marks.length }
}

const WORD_END = /[\p{L}\p{N}_'-]*$/u
const WORD_START = /^[\p{L}\p{N}_'-]*/u

// Offset in a block's markdown `raw` for a tap between rendered
// `textBefore` and `textAfter`: the same occurrence of the tapped word, at
// the same letter. 0 (block start) when the word can't be found.
export function tapOffset(raw, textBefore, textAfter) {
  const prefix = textBefore.match(WORD_END)[0]
  const word = prefix + textAfter.match(WORD_START)[0]
  if (!word) return 0
  const earlier = textBefore.slice(0, textBefore.length - prefix.length).split(word).length - 1
  let at = -1
  for (let i = 0; i <= earlier; i++) {
    at = raw.indexOf(word, at + 1)
    if (at === -1) return 0
  }
  return at + prefix.length
}

// Repo path for a relative image src in the note at `notePath`, or null for
// external URLs.
export function resolveImage(notePath, src) {
  if (!src || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(src)) return null
  let rel
  try { rel = decodeURI(src.split(/[?#]/)[0]) } catch { return null }
  const parts = rel.startsWith('/') ? [] : notePath.split('/').slice(0, -1)
  for (const seg of rel.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return parts.join('/')
}

const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Inline markdown, matched left to right on escaped text. Each pattern is
// wrapped as a whole, markers included, so the text keeps its exact length.
const INLINE = [
  ['text-muted-foreground', /`[^`\n]+`/],
  ['text-primary-ink', /!?\[[^\]\n]*\]\([^)\n]*\)/],
  ['text-primary-ink', /https?:\/\/[^\s<)]+/],
  ['font-bold', /\*\*(?!\s)[^*\n]+?\*\*|__(?!\s)[^_\n]+?__/],
  ['italic', /(?<![\w*])\*(?![\s*])[^*\n]+?\*(?!\*)|(?<![\w_])_(?![\s_])[^_\n]+?_(?![\w_])/],
  ['line-through', /~~[^~\n]+~~/],
  ['underline', /&lt;u&gt;.+?&lt;\/u&gt;/],
]
const INLINE_RE = new RegExp(INLINE.map(([, re]) => `(${re.source})`).join('|'), 'g')

function highlightInline(line) {
  return line.replace(INLINE_RE, (match, ...groups) => {
    const kind = INLINE[groups.findIndex(g => g !== undefined)][0]
    return `<span class="${kind}">${match}</span>`
  })
}

// HTML for the styling layer behind the markdown editor: same characters as
// `text`, with links/images in the accent color and bold/italic/etc. styled.
// The indexes of `text`'s lines that set one of the properties `keys` in its front matter: the `key: value` line and its
// `- item` lines, between a first line `---` and the next `---` or `...` line (none when that's missing: then it isn't front
// matter, as for frontMatter). The markdown editor greys them out and refuses typing that changes them (a planner's date and repeat).
export function keyLines(text, keys) {
  if (!keys.length) return []
  const lines = text.split('\n')
  if (!/^---\s*$/.test(lines[0])) return []
  const close = lines.findIndex((l, i) => i > 0 && /^(---|\.\.\.)\s*$/.test(l))
  if (close < 0) return []
  const out = []
  let inKey = false // the line belongs to one of `keys`
  for (let i = 1; i < close; i++) {
    const m = lines[i].match(/^([^\s#][^:]*):/)
    if (m) inKey = keys.includes(m[1].trim())
    else if (!/^\s+-\s/.test(lines[i])) inKey = false
    if (inKey) out.push(i)
  }
  return out
}

// `locked`: property keys whose lines (keyLines) are greyed out, as they can't be edited here
export function highlightMarkdown(text, locked = []) {
  let inFence = false
  const greyed = new Set(keyLines(text, locked))
  const lines = text.split('\n').map((raw, i) => {
    const line = escapeHtml(raw)
    if (greyed.has(i)) return `<span class="text-muted-foreground/50">${line}</span>`
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence
      return `<span class="text-muted-foreground">${line}</span>`
    }
    if (inFence) return `<span class="text-muted-foreground">${line}</span>`
    if (/^#{1,6}\s/.test(raw)) return `<span class="font-bold">${highlightInline(line)}</span>`
    return highlightInline(line)
  })
  // A trailing space keeps a final empty line as tall as in the textarea
  return lines.join('\n') + ' '
}
