import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { resolveImage } from './markdown.js'
import { linkTarget } from './links.js'

// Phosphor icons (regular), inline because preview content is HTML. Same
// shapes as the file list: Folder, FileText for notes, File otherwise;
// LinkBreak (grey, .link-broken) when the target is missing.
const ICON_PATHS = {
  folder: 'M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z',
  note: 'M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-32-80a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,136Zm0,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z',
  file: 'M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z',
  missing: 'M198.63,57.37a32,32,0,0,0-45.19-.06L141.79,69.52a8,8,0,0,1-11.58-11l11.72-12.29a1.59,1.59,0,0,1,.13-.13,48,48,0,0,1,67.88,67.88,1.59,1.59,0,0,1-.13.13l-12.29,11.72a8,8,0,0,1-11-11.58l12.21-11.65A32,32,0,0,0,198.63,57.37ZM114.21,186.48l-11.65,12.21a32,32,0,0,1-45.25-45.25l12.21-11.65a8,8,0,0,0-11-11.58L46.19,141.93a1.59,1.59,0,0,0-.13.13,48,48,0,0,0,67.88,67.88,1.59,1.59,0,0,0,.13-.13l11.72-12.29a8,8,0,1,0-11.58-11ZM216,152H192a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16ZM40,104H64a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16Zm120,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V192A8,8,0,0,0,160,184ZM96,72a8,8,0,0,0,8-8V40a8,8,0,0,0-16,0V64A8,8,0,0,0,96,72Z',
}
const linkIcon = kind => `<svg class="link-icon" aria-hidden="true" viewBox="0 0 256 256" fill="currentColor"><path d="${ICON_PATHS[kind]}"/></svg>`

// External links (websites) get a colored ↗ after them; internal links
// (notes, files, folders in the repo) a colored icon of what they point to,
// grey when it's missing. `files`: the repo's paths as keys. Styles:
// .link-external / .link-internal in App.css
export function decorateLinks(root, notePath, files) {
  for (const a of root.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href')
    if (!href || href.startsWith('#')) continue
    const repoPath = resolveImage(notePath, href)
    if (repoPath) {
      const kind = linkTarget(repoPath, files)?.kind ?? 'missing'
      a.classList.add('link-internal')
      if (kind === 'missing') a.classList.add('link-broken')
      a.insertAdjacentHTML('afterbegin', linkIcon(kind))
    } else {
      a.classList.add('link-external')
      a.insertAdjacentHTML('beforeend', '<span class="link-arrow" aria-hidden="true">↗</span>')
    }
  }
}

// HTML for one line of markdown (a property's value): safe, with its links
// decorated like the preview's
export function inlineHtml(text, notePath, files) {
  const tpl = document.createElement('template')
  tpl.innerHTML = DOMPurify.sanitize(marked.parseInline(text))
  decorateLinks(tpl.content, notePath, files)
  return tpl.innerHTML
}

// What a click on a link does: websites open in a new tab, a folder or file in
// the repo opens in the app, a missing one calls `onBroken`
export function openLink(href, { path, files, onOpenFile, onNavigate, onBroken }) {
  const repoPath = resolveImage(path, href)
  if (!repoPath) { window.open(href, '_blank', 'noopener,noreferrer'); return }
  const target = linkTarget(repoPath, files)
  if (target?.kind === 'folder') onNavigate?.(target.path)
  else if (target) onOpenFile?.(target.path)
  else onBroken?.()
}
