import { marked } from 'marked'
import { blankFrontMatter, frontMatter, noteTitle } from './frontmatter.js'
import { splitName } from './changes.js'
import { safeHtml } from './sanitize.js'
import './markdown.js' // the app's marked options (line breaks, dividers)

// A note's exports (the item ⋯'s Export): its title and text, without its properties. The title goes on top unless the
// note already starts with it as a "# heading".

// The note's body (no front matter) and whether its title still has to go on top
function parts(text, fallback) {
  const body = text.slice(frontMatter(text)?.end ?? 0).replace(/^\s+/, '')
  const title = noteTitle(text, fallback)
  const first = body.match(/^ {0,3}#[ \t]+(.+?)[ \t#]*(?:\n|$)/)
  return { body, title: first?.[1] === title ? null : title }
}

// An exported file's name: the note's, with the export's extension
export const exportName = (name, ext) => `${splitName(name)[0]}.${ext}`

// Inline tokens as plain text: links keep their text, images their alt, code its text
const inline = tokens => (tokens ?? []).map(t =>
  t.type === 'br' ? '\n'
    : t.type === 'image' ? t.text
      : t.type === 'html' ? ''
        : t.tokens ? inline(t.tokens)
          : t.type === 'escape' || t.type === 'codespan' ? t.text
            : decode(t.text ?? '')).join('')

const decode = s => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e])

const indent = (s, pad) => s.split('\n').map(l => l ? pad + l : l).join('\n')

// Block tokens as plain text, one blank line between blocks
function blocks(tokens) {
  return tokens.map(t => {
    switch (t.type) {
      case 'heading': return inline(t.tokens)
      case 'paragraph': case 'text': return t.tokens ? inline(t.tokens) : decode(t.text)
      case 'code': return t.text
      case 'blockquote': return indent(blocks(t.tokens), '> ')
      case 'hr': return '———'
      case 'list': return t.items.map((item, i) => {
        const mark = (t.ordered ? `${(t.start || 1) + i}.` : '-') + (item.task ? (item.checked ? ' [x]' : ' [ ]') : '')
        const content = blocks(item.tokens.filter(x => x.type !== 'checkbox')).replace(/\n\n+/g, '\n')
        return `${mark} ${indent(content, ' '.repeat(mark.length + 1)).trimStart()}`
      }).join('\n')
      case 'table': return [t.header, ...t.rows].map(row => row.map(c => inline(c.tokens)).join('\t')).join('\n')
      default: return '' // html, space
    }
  }).filter(Boolean).join('\n\n')
}

// The note as plain text: its title, then its text with the markdown taken out
export function exportText(text, fallback) {
  const { body, title } = parts(text, fallback)
  const plain = blocks(marked.lexer(body))
  return (title ? `${title}\n\n${plain}` : plain).trimEnd() + '\n'
}

const escape = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// The note as a page to print (or save as PDF): its title, then its text rendered, with its own style, for a shadow root
// (so the app's styles don't reach it). Only images the page can load on its own stay (a web or data address); the
// repo's own aren't reachable from it. The page is printed, not shown in the app, so it has its own print style (black
// on white), not the app's tokens.
export function exportPage(text, fallback) {
  const { body, title } = parts(text, fallback)
  const doc = new DOMParser().parseFromString(safeHtml(marked.parse(blankFrontMatter(body))), 'text/html')
  for (const img of doc.querySelectorAll('img')) if (!/^(https?:|data:image\/)/i.test(img.getAttribute('src') ?? '')) img.remove()
  for (const box of doc.querySelectorAll('input')) box.removeAttribute('disabled') // a disabled box prints grey
  return `<style>${PRINT_STYLE}</style>${title ? `<h1>${escape(title)}</h1>` : ''}${doc.body.innerHTML}`
}

const PRINT_STYLE = `
:host { display: block; font: 11pt/1.5 Georgia, 'Times New Roman', serif; color: #000; background: #fff; }
h1, h2, h3, h4, h5, h6 { font-family: system-ui, sans-serif; line-height: 1.25; break-after: avoid; }
h1 { font-size: 20pt; } h2 { font-size: 16pt; } h3 { font-size: 13pt; }
a { color: inherit; }
img { max-width: 100%; }
pre, code { font: 9.5pt ui-monospace, monospace; }
pre { white-space: pre-wrap; border: 1px solid #ccc; padding: 0.5em; }
blockquote { margin-left: 0; padding-left: 1em; border-left: 3px solid #ccc; }
table { border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 0.25em 0.5em; text-align: left; }
li:has(> input) { list-style: none; } input { accent-color: #000; margin: 0 0.4em 0 -1.4em; }
pre, blockquote, table, img, li { break-inside: avoid; }
`
