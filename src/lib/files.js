// File-type helpers shared by the file list and the note preview.

const IMAGE_MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  svg: 'image/svg+xml', avif: 'image/avif', bmp: 'image/bmp', heic: 'image/heic',
}

const extension = path => path.includes('.') ? path.split('.').pop().toLowerCase() : ''

// MIME type for an image path, or undefined if it isn't an image
export function imageMime(path) {
  return IMAGE_MIME[extension(path)]
}

export const isImage = path => imageMime(path) !== undefined

// What a file is, for its icon and how it opens: 'note' (markdown, edited),
// 'image' and 'pdf' (viewed), or 'file' (can't be opened)
export function fileKind(path) {
  const ext = extension(path)
  if (ext === 'md') return 'note'
  if (ext === 'pdf') return 'pdf'
  return IMAGE_MIME[ext] ? 'image' : 'file'
}

// A note's name as shown in the app: last path segment without ".md"
export function displayName(path) {
  return path.split('/').pop().replace(/\.md$/, '')
}

// Emoji-like first character (anything past the box-drawing block)
export const isEmoji = char => !!char && char.codePointAt(0) > 0x2500

// A note's title: its first line, when that is a "# heading" (blank lines
// before it are allowed). `head` is that line plus the blank lines after
// it, `body` the rest, so head + body is the whole text. Without a title,
// head is '' and title and emoji are null.
const TITLE = /^((?:[ \t]*\r?\n)*)# (.*?)(?:[ \t]+#+)?[ \t]*(\r?\n(?:[ \t]*\r?\n)*|$)/

export function splitTitle(text = '') {
  const m = TITLE.exec(text)
  if (!m) return { emoji: null, title: null, head: '', body: text }
  const [head, , line] = m
  const first = [...line][0]
  const emoji = isEmoji(first) ? first : null
  const title = emoji ? line.slice(first.length).trim() : line.trim()
  return { emoji, title, head, body: text.slice(head.length) }
}

// `text` with its title set to `title` (its emoji kept); a note without one
// gets a "# title" line on top
export function withTitle(text, title) {
  const m = TITLE.exec(text)
  if (!m) return `# ${title}\n` + (text ? '\n' + text : '')
  const [head, lead, , after] = m
  const { emoji } = splitTitle(text)
  return lead + '# ' + (emoji ? emoji + ' ' : '') + title + (after || '') + text.slice(head.length)
}

// The emoji a note's title starts with, or null
export const headingEmoji = text => splitTitle(text ?? '').emoji
