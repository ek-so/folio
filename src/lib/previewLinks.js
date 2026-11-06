import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { resolveImage, linkSpans } from './markdown.js'
import { linkTarget } from './links.js'

// `a` swapped for a link spot (below), which it returns
function linkSpot(a, notePath, files) {
  const href = a.getAttribute('href')
  const repoPath = resolveImage(notePath, href)
  const spot = document.createElement('span')
  spot.className = 'link-spot'
  spot.dataset.href = href
  spot.dataset.text = a.textContent.trim() || href
  const target = repoPath && linkTarget(repoPath, files)
  spot.dataset.kind = repoPath ? target?.kind ?? 'missing' : 'web'
  if (target) spot.dataset.path = target.path
  a.replaceWith(spot)
  return spot
}

// The note preview's links, swapped for spots where MarkdownPreview renders a LinkBadge:
// <span class="link-spot"> with `data-href`, `data-text` (what the link shows), `data-kind`
// (`web`, or `note` / `file` / `folder` / `missing` in the repo), `data-path` (where it points in the repo, when it's there) and `data-span`, the link's
// index in `spans` (lib/markdown.js linkSpans) when the block's links line up with them (else
// it can only be opened and copied). Links to a heading (#…) and around an image stay as they are.
export function linkSpots(root, notePath, files, spans) {
  for (const block of root.querySelectorAll('[data-src]')) {
    const start = Number(block.dataset.src)
    const end = start + Number(block.dataset.len)
    const own = spans.flatMap((s, i) => s.start >= start && s.end <= end ? [i] : [])
    const anchors = [...block.querySelectorAll('a[href]')]
    anchors.forEach((a, i) => {
      const href = a.getAttribute('href')
      if (!href || href.startsWith('#') || a.querySelector('img')) return
      const spot = linkSpot(a, notePath, files)
      if (anchors.length === own.length) spot.dataset.span = String(own[i])
    })
  }
}

// HTML for one line of markdown (a property's value): safe, with its links as link spots, `data-span`
// as in the preview (InlineMarkdown renders a LinkBadge in each)
export function inlineHtml(text, notePath, files) {
  const tpl = document.createElement('template')
  tpl.innerHTML = DOMPurify.sanitize(marked.parseInline(text))
  const anchors = [...tpl.content.querySelectorAll('a[href]')]
  const lined = anchors.length === linkSpans(text).length // `data-span` as in the preview
  anchors.forEach((a, i) => {
    const href = a.getAttribute('href')
    if (!href || href.startsWith('#') || a.querySelector('img')) return
    const spot = linkSpot(a, notePath, files)
    if (lined) spot.dataset.span = String(i)
  })
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
