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

// The emoji a note's first "# heading" starts with, or null
export function headingEmoji(text) {
  const m = /^# /m.exec(text ?? '')
  if (!m) return null
  const first = [...text.slice(m.index + 2)][0]
  return isEmoji(first) ? first : null
}
