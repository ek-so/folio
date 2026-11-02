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

// Prevent marked from treating "text\n---" as a setext h2 heading.
// A bare "---" preceded by content (no blank line) is almost always meant as
// a divider, not a heading underline — especially in YAML front-matter blocks.
function breakSetextHr(md) {
  return md.replace(/(^|\n)([^\n]+)\n(---[ \t]*(?:\n|$))/g, '$1$2\n\n$3')
}

// HTML (unsanitized) where each top-level block is wrapped in
// <div data-src="start" data-len="length"> pointing at its markdown source.
export function renderBlocks(markdown) {
  const tokens = marked.lexer(breakSetextHr(markdown))
  let offset = 0
  let html = ''
  for (const token of tokens) {
    const found = markdown.indexOf(token.raw, offset)
    const start = found === -1 ? offset : found
    offset = start + token.raw.length
    if (token.type === 'space') continue
    const part = marked.parser(Object.assign([token], { links: tokens.links }))
    if (part) html += `<div data-src="${start}" data-len="${token.raw.length}">${part}</div>`
  }
  return html
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
