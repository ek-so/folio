import { marked } from 'marked'

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

// How many <details> a raw HTML token opens, minus how many it closes
const detailsDepth = raw => (raw.match(/<details[\s>]/gi) || []).length - (raw.match(/<\/details>/gi) || []).length

// HTML (unsanitized) where each top-level block is wrapped in
// <div data-src="start" data-len="length"> pointing at its markdown source.
// A <details> accordion (as on GitHub: <summary>, then markdown after a blank
// line, then </details>) is one block from its opening to its closing tag, so
// the browser doesn't close it early.
export function renderBlocks(markdown) {
  const tokens = marked.lexer(markdown)
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

// Offsets of each task checkbox's mark (the " " or "x" in "- [ ]") in a
// block's markdown, in order. Only a box opening a list item counts, not
// "[x]" further along in its text.
const TASK = /^[ \t>]*(?:[-*+]|\d+[.)])[ \t]+\[[ xX]\]/gm
export const taskOffsets = raw => [...raw.matchAll(TASK)].map(m => m.index + m[0].length - 2)

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

// Syntax characters (**, [](), #, -, <u>…) are faded so the text stands out
const mark = s => s && `<span class="opacity-50">${s}</span>`

// Wraps a match in `kind`, fading `open` leading and `close` trailing chars
const wrap = (kind, open, close) => m =>
  `<span class="${kind}">${mark(m.slice(0, open))}${m.slice(open, m.length - close)}${mark(m.slice(m.length - close))}</span>`

// Inline markdown, matched left to right on escaped text. Each pattern is
// wrapped as a whole, markers included, so the text keeps its exact length.
const INLINE = [
  [/`[^`\n]+`/, wrap('text-muted-foreground', 1, 1)],
  [/!?\[[^\]\n]*\]\([^)\n]*\)/, m => wrap('text-primary', m.indexOf('[') + 1, m.length - m.lastIndexOf(']('))(m)],
  [/https?:\/\/[^\s<)]+/, wrap('text-primary', 0, 0)],
  [/\*\*(?!\s)[^*\n]+?\*\*|__(?!\s)[^_\n]+?__/, wrap('font-bold', 2, 2)],
  [/(?<![\w*])\*(?![\s*])[^*\n]+?\*(?!\*)|(?<![\w_])_(?![\s_])[^_\n]+?_(?![\w_])/, wrap('italic', 1, 1)],
  [/~~[^~\n]+~~/, wrap('line-through', 2, 2)],
  [/&lt;u&gt;.+?&lt;\/u&gt;/, wrap('underline', 9, 10)],
  [/&lt;\/?[a-zA-Z][^\n]*?&gt;/, mark],
  [/\|/, mark],
]
const INLINE_RE = new RegExp(INLINE.map(([re]) => `(${re.source})`).join('|'), 'g')

function highlightInline(line) {
  return line.replace(INLINE_RE, (match, ...groups) => INLINE[groups.findIndex(g => g !== undefined)][1](match))
}

// Line start: quote >, heading #, list bullet or number, task box
const PREFIX = /^\s*(?:&gt;\s*)*(?:#{1,6}(?:\s|$)|(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\](?=\s|$))?)?/
const RULE = /^\s*([-*_])(?:\s*\1){2,}\s*$|^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|?\s*$/

function highlightLine(raw) {
  const line = escapeHtml(raw)
  if (RULE.test(raw)) return mark(line)
  const prefix = line.match(PREFIX)[0]
  const rest = highlightInline(line.slice(prefix.length))
  return prefix.includes('#') ? `<span class="font-bold">${mark(prefix)}${rest}</span>` : mark(prefix) + rest
}

// HTML for the styling layer behind the markdown editor: same characters as
// `text`, with links/images in the accent color, bold/italic/etc. styled and
// the markdown syntax faded.
export function highlightMarkdown(text) {
  let inFence = false
  const lines = text.split('\n').map(raw => {
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence
      return `<span class="text-muted-foreground">${mark(escapeHtml(raw))}</span>`
    }
    if (inFence) return `<span class="text-muted-foreground">${escapeHtml(raw)}</span>`
    return highlightLine(raw)
  })
  // A trailing space keeps a final empty line as tall as in the textarea
  return lines.join('\n') + ' '
}
