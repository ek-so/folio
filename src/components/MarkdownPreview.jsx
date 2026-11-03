import { useMemo, useEffect, useLayoutEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import DOMPurify from 'dompurify'
import { renderBlocks, tapOffset, taskOffsets, resolveImage } from '../lib/markdown.js'
import { useRepoImages } from '../hooks/useRepoImages.js'
import { linkTarget } from '../lib/links.js'
import { CaretRight } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'

// Text node and offset under a screen point
function caretAt(x, y) {
  if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y)
    return r && { node: r.startContainer, offset: r.startOffset }
  }
  const p = document.caretPositionFromPoint?.(x, y)
  return p && { node: p.offsetNode, offset: p.offset }
}

// Two taps within this time and distance count as a double tap
const DOUBLE_TAP_MS = 350
const DOUBLE_TAP_PX = 30

const LONG_WORD = /(\S{16,})/
const BREAK_EVERY = 8

// Long unbroken words (tokens, URLs) in table cells get <wbr> break points,
// so tables fit the screen without splitting short words. <wbr> adds no
// characters, so copied text stays intact.
function breakLongWords(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node.parentElement.closest('td, th') && LONG_WORD.test(node.data)) nodes.push(node)
  }
  for (const node of nodes) {
    // split() with a capture group puts the long words at odd indexes
    const parts = node.data.split(LONG_WORD).flatMap((part, i) => {
      if (i % 2 === 0) return part ? [part] : []
      const chunks = part.match(new RegExp(`.{1,${BREAK_EVERY}}`, 'g'))
      return chunks.flatMap((chunk, j) => j ? [document.createElement('wbr'), chunk] : [chunk])
    })
    node.replaceWith(...parts)
  }
}

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

// <img> elements in `root` that show repo files: [img, repo path]
const repoImages = (root, notePath) => [...root.querySelectorAll('img')]
  .map(img => [img, resolveImage(notePath, img.getAttribute('src'))])
  .filter(([, repoPath]) => repoPath !== null)

// Rendered note, read-only apart from task checkboxes. Double-tapping (or
// double-clicking) text calls onDoubleTap with the markdown offset of the
// tapped word. On mount, scrolls the block holding `scrollTo` (a markdown
// offset) into view. The ref's
// visibleOffset() is the markdown offset of the first block on screen, where
// editing starts. `children` render above the note and `footer` below it;
// both scroll with it.
const MarkdownPreview = forwardRef(function MarkdownPreview({ content, path, files, scrollTo, onDoubleTap, onChange, onOpenFile, onNavigate, footer, children }, handle) {
  const ref = useRef()
  const scrollRef = useRef()
  const lastTap = useRef(null) // { time, x, y } of the previous tap on text
  const openDetails = useRef(new Set()) // indexes of accordions opened by the reader
  const [carets, setCarets] = useState([]) // accordion title spots for CaretRight

  useImperativeHandle(handle, () => ({
    visibleOffset() {
      const top = scrollRef.current.getBoundingClientRect().top
      const block = [...ref.current.querySelectorAll('[data-src]')].find(el => el.getBoundingClientRect().bottom > top)
      return block ? Number(block.dataset.src) : 0
    },
  }))
  const [brokenTip, setBrokenTip] = useState(null)
  const tipTimer = useRef()
  const linkHandlerRef = useRef()

  const [html, imagePaths] = useMemo(() => {
    const sanitized = DOMPurify.sanitize(renderBlocks(content))
    const tpl = document.createElement('template')
    tpl.innerHTML = sanitized
    // External links (websites) get a colored ↗ after them; internal links
    // (notes, files, folders in the repo) a colored icon of what they point to.
    // Styles: .link-external / .link-internal in App.css
    for (const a of tpl.content.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href')
      if (!href || href.startsWith('#')) continue
      const repoPath = resolveImage(path, href)
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
    breakLongWords(tpl.content)
    // Task list items: remove bullet, enable checkbox, record markdown offset
    for (const cb of tpl.content.querySelectorAll('input[type="checkbox"]')) {
      cb.closest('li')?.classList.add('task-item')
      cb.removeAttribute('disabled')
      const block = cb.closest('[data-src]')
      if (!block) continue
      const blockStart = Number(block.dataset.src)
      const blockRaw = content.slice(blockStart, blockStart + Number(block.dataset.len))
      const idx = [...block.querySelectorAll('input[type="checkbox"]')].indexOf(cb)
      const at = taskOffsets(blockRaw)[idx]
      if (at !== undefined) cb.dataset.offset = String(blockStart + at)
    }
    // Accordion titles start with a spot for Phosphor's caret, rendered into
    // it below (▸, turned ▾ when open in App.css)
    for (const summary of tpl.content.querySelectorAll('summary')) {
      summary.insertAdjacentHTML('afterbegin', '<span class="summary-caret" aria-hidden="true"></span>')
    }
    return [tpl.innerHTML, repoImages(tpl.content, path).map(([, repoPath]) => repoPath)]
  }, [content, path, files])

  const images = useRepoImages(imagePaths, files)

  // Repo images swapped for loaded data URLs
  const withImages = useMemo(() => {
    const tpl = document.createElement('template')
    tpl.innerHTML = html
    for (const [img, repoPath] of repoImages(tpl.content, path)) {
      if (images[repoPath]) img.setAttribute('src', images[repoPath])
      else img.removeAttribute('src')
    }
    return tpl.innerHTML
  }, [html, images, path])

  useEffect(() => {
    if (scrollTo === null || scrollTo === undefined) return
    const block = [...ref.current.querySelectorAll('[data-src]')]
      .find(el => scrollTo < Number(el.dataset.src) + Number(el.dataset.len))
    block?.scrollIntoView({ block: 'center' })
  }, [])

  useEffect(() => () => clearTimeout(tipTimer.current), [])

  // Accordions stay open when the note re-renders (e.g. ticking a checkbox
  // inside one), so remember which ones the reader opened
  useEffect(() => {
    const el = ref.current
    const onToggle = () => {
      openDetails.current = new Set([...el.querySelectorAll('details')].flatMap((d, i) => d.open ? [i] : []))
    }
    el.addEventListener('toggle', onToggle, true)
    return () => el.removeEventListener('toggle', onToggle, true)
  }, [])

  useLayoutEffect(() => {
    ref.current.querySelectorAll('details').forEach((d, i) => { if (openDetails.current.has(i)) d.open = true })
    setCarets([...ref.current.querySelectorAll('.summary-caret')])
  }, [withImages])

  // Always up-to-date handler without re-attaching the listener
  linkHandlerRef.current = (e) => {
    const link = e.target.closest('a')
    if (!link || !ref.current?.contains(link)) return
    const href = link.getAttribute('href')
    if (!href || href.startsWith('#')) return
    e.preventDefault()
    const repoPath = resolveImage(path, href)
    if (!repoPath) {
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }
    const target = linkTarget(repoPath, files)
    if (target?.kind === 'folder') {
      onNavigate?.(target.path)
    } else if (target) {
      onOpenFile?.(target.path)
    } else {
      clearTimeout(tipTimer.current)
      setBrokenTip({ x: e.clientX, y: e.clientY })
      tipTimer.current = setTimeout(() => setBrokenTip(null), 2000)
    }
  }

  // Capture-phase native listener intercepts link clicks before browser navigation
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e) => linkHandlerRef.current(e)
    el.addEventListener('click', handler, true)
    return () => el.removeEventListener('click', handler, true)
  }, [])

  // Markdown offset for a tap: the tapped block, at the tapped word
  function offsetAt(x, y, target) {
    const block = target.closest('[data-src]')
    if (!block) return content.length
    const start = Number(block.dataset.src)
    const raw = content.slice(start, start + Number(block.dataset.len))
    const caret = caretAt(x, y)
    if (!caret || !block.contains(caret.node)) return start
    const before = document.createRange()
    before.setStart(block, 0)
    before.setEnd(caret.node, caret.offset)
    const textAfter = caret.node.nodeType === Node.TEXT_NODE ? caret.node.textContent.slice(caret.offset) : ''
    return start + tapOffset(raw, before.toString(), textAfter)
  }

  function handleClick(e) {
    if (e.target.matches('input[type="checkbox"]')) {
      const offset = Number(e.target.dataset.offset)
      if (onChange && !isNaN(offset)) {
        const char = e.target.checked ? 'x' : ' '
        onChange(content.slice(0, offset) + char + content.slice(offset + 1))
      }
      return
    }
    if (e.target.closest('a, img, summary')) return // summary opens/closes its accordion
    // Counted here rather than with dblclick, which iPhones don't send on a
    // double tap; it must run inside the tap so the keyboard opens
    const prev = lastTap.current
    const now = { time: e.timeStamp, x: e.clientX, y: e.clientY }
    const double = prev && now.time - prev.time < DOUBLE_TAP_MS
      && Math.hypot(now.x - prev.x, now.y - prev.y) < DOUBLE_TAP_PX
    lastTap.current = double ? null : now
    if (double) onDoubleTap?.(offsetAt(e.clientX, e.clientY, e.target))
  }

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
      {children}
      <div
        ref={ref}
        className="editor-preview px-5 py-4 text-base leading-relaxed touch-manipulation [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: withImages || '<p class="text-muted-foreground italic">Nothing to preview yet.</p>' }}
      />
      {carets.map((spot, i) => createPortal(<CaretRight />, spot, i))}
      {footer}
      {brokenTip && (
        <div
          className="fixed z-50 rounded-md border border-border bg-popover text-foreground text-sm px-2 py-1 shadow-md pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: brokenTip.x, top: brokenTip.y - 6 }}
        >
          Link is broken
        </div>
      )}
    </div>
  )
})

export default MarkdownPreview
