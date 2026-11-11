import { withoutEmoji } from './icons.js'
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

// What a file is, for its icon and how it opens: 'note' (markdown, edited),
// 'image' and 'pdf' (viewed), or 'file' (can't be opened)
export function fileKind(path) {
  const ext = extension(path)
  if (ext === 'md') return 'note'
  if (ext === 'pdf') return 'pdf'
  return IMAGE_MIME[ext] ? 'image' : 'file'
}

// A note's own name: last path segment without ".md" (what a link to it says)
export const fileName = path => path.split('/').pop().replace(/\.md$/, '')

// A note's name as shown in the app: its own name without the emoji it starts with (that shows as its icon, lib/icons.js)
export const displayName = path => withoutEmoji(fileName(path))

// Why a symlink can't be opened
export const LINK_ERRORS = {
  outside: 'points outside the repo',
  missing: 'source is missing',
  unavailable: 'not on this device yet',
}

// A name GitHub accepts for a new repo: letters, digits, dots, dashes and underscores
export const isRepoName = value => /^[\w.-]+$/.test(value) && value !== '.' && value !== '..'

// 'owner/repo' typed by the user as [owner, repo], or null if it isn't one
export function parseRepo(value) {
  const parts = value.trim().split('/')
  return parts.length === 2 && parts[0] && parts[1] ? parts : null
}
