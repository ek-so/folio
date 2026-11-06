import { marked } from 'marked'
import { blankFrontMatter } from './frontmatter.js'

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

// Smart tables: inside table cells (not in code or links), an ISO date
// "2025-03-18" that is a real calendar day shows as a date chip. The markdown
// stays a plain table any editor can read.
const ISO_DATE = /(?<![\d-])(\d{4})-(\d{2})-(\d{2})(?![\d-])/g

// The Date for "YYYY-MM-DD" (UTC midnight), or null if it isn't a real day
export function parseIsoDate(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!m) return null
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return date.getUTCMonth() === +m[2] - 1 && date.getUTCDate() === +m[3] ? date : null
}

// A text token split into text and date tokens
function splitDates(token) {
  const parts = []
  let last = 0
  for (const m of token.text.matchAll(ISO_DATE)) {
    const date = parseIsoDate(m[0])
    if (!date) continue
    if (m.index > last) parts.push({ type: 'text', raw: token.text.slice(last, m.index), text: token.text.slice(last, m.index), escaped: token.escaped })
    parts.push({ type: 'isoDate', raw: m[0], text: m[0], date })
    last = m.index + m[0].length
  }
  if (!parts.length) return [token]
  if (last < token.text.length) parts.push({ type: 'text', raw: token.text.slice(last), text: token.text.slice(last), escaped: token.escaped })
  return parts
}

// Inline tokens with their text's dates turned into date tokens; links and code are left alone
const withDates = tokens => tokens.flatMap(t =>
  t.type === 'text' && !t.tokens ? splitDates(t)
    : t.tokens && t.type !== 'link' ? [{ ...t, tokens: withDates(t.tokens) }]
      : [t])

const dateLabel = date => date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

marked.use({
  extensions: [{
    name: 'isoDate',
    renderer: ({ text, date }) => `<time class="date-chip" datetime="${text}" title="${text}">${dateLabel(date)}</time>`,
  }],
})

// Run on the lexed tokens (renderBlocks lexes and parses separately, so marked's own walkTokens doesn't run)
const addDates = token => {
  if (token.type !== 'table') return
  for (const cell of [...token.header, ...token.rows.flat()]) cell.tokens = withDates(cell.tokens)
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

// `text` with the link at `span` replaced by `markdown`; '' takes the link out with
// one of the spaces around it
export function replaceLink(text, span, markdown) {
  let { start, end } = span
  if (!markdown && text[end] === ' ' && (start === 0 || /[ \n]/.test(text[start - 1]))) end++
  else if (!markdown && text[start - 1] === ' ' && /^[ \n]?$/.test(text[end] ?? '')) start--
  return text.slice(0, start) + markdown + text.slice(end)
}

// The lists in a list block's markdown `raw`, nested ones too, in the order the preview
// renders them: [{ ordered, first, items: [{ start, end }] }]. An item runs from its marker
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
      const item = { start: at, end: raw.length }
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
  ['text-primary', /!?\[[^\]\n]*\]\([^)\n]*\)/],
  ['text-primary', /https?:\/\/[^\s<)]+/],
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
export function highlightMarkdown(text) {
  let inFence = false
  const lines = text.split('\n').map(raw => {
    const line = escapeHtml(raw)
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
