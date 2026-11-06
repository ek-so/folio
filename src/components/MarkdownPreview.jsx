import { useMemo, useEffect, useLayoutEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import DOMPurify from 'dompurify'
import { renderBlocks, tapOffset, taskOffsets, resolveImage, linkSpans, listsIn, moveListItem, firstWord } from '../lib/markdown.js'
import { useRepoImages } from '../hooks/useRepoImages.js'
import { linkSpots, openLink } from '../lib/previewLinks.js'
import { isPortaled } from '../lib/utils.js'
import { CaretRight } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'
import LinkBadge from './LinkBadge.jsx'
import DateBadge from './DateBadge.jsx'
import { useLinkEdits } from '../hooks/useLinkEdits.jsx'
import ListGrip from './ListGrip.jsx'
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

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

// A rendered list item's first word: its link and date badges' spots count as their text, its sub-lists don't
function itemWord(li) {
  const copy = li.cloneNode(true)
  copy.querySelectorAll('ul, ol').forEach(l => l.remove())
  copy.querySelectorAll('.link-spot').forEach(s => s.replaceWith(s.dataset.text))
  copy.querySelectorAll('.date-spot').forEach(s => s.replaceWith(s.dataset.label))
  return firstWord(copy.textContent)
}

// List items get a `.list-grip` spot to drag them by (ListGrip): `data-list` (its list's index in
// the returned lists, offsets into the note) and `data-item`. Only where the block's lists line up
// with its markdown (listsIn: as many lists and items, each starting with the same word): not in a
// quote, for one
function listGrips(root, content) {
  const lists = []
  for (const block of root.querySelectorAll('[data-src]')) {
    const start = Number(block.dataset.src)
    const found = listsIn(content.slice(start, start + Number(block.dataset.len)))
    const rendered = [...block.querySelectorAll('ul, ol')].map(l => l.querySelectorAll(':scope > li'))
    if (!found.length || found.length !== rendered.length || found.some((l, i) => l.items.length !== rendered[i].length || l.items.some((it, j) => it.word !== itemWord(rendered[i][j])))) continue
    found.forEach((list, i) => {
      const key = lists.push({ ...list, items: list.items.map(it => ({ start: start + it.start, end: start + it.end })) }) - 1
      rendered[i].forEach((li, j) => li.insertAdjacentHTML('afterbegin', `<span class="list-grip" data-list="${key}" data-item="${j}"></span>`))
    })
  }
  return lists
}

// Dragging a list item only lands among its own list's items
const ownList = args => closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(c => c.data.current?.list === args.active.data.current?.list) })

// <img> elements in `root` that show repo files: [img, repo path]
const repoImages = (root, notePath) => [...root.querySelectorAll('img')]
  .map(img => [img, resolveImage(notePath, img.getAttribute('src'))])
  .filter(([, repoPath]) => repoPath !== null)

// Rendered note, read-only apart from task checkboxes, links' Edit link / Remove and dragging
// list items into another order (with `onChange`). Double-tapping (or
// double-clicking) text calls onDoubleTap with the markdown offset of the
// tapped word. On mount, scrolls the block holding `scrollTo` (a markdown
// offset) into view. The ref's
// visibleOffset() is the markdown offset of the first block on screen, where
// editing starts. `children` render above the note (a double tap there edits
// from the start of the file) and `footer` below it; both scroll with it.
const MarkdownPreview = forwardRef(function MarkdownPreview({ content, path, files, scrollTo, onDoubleTap, onChange, onOpenFile, onNavigate, footer, children }, handle) {
  const ref = useRef()
  const scrollRef = useRef()
  const lastTap = useRef(null) // { time, x, y } of the previous tap on text
  const openDetails = useRef(new Set()) // indexes of accordions opened by the reader
  const [carets, setCarets] = useState([]) // accordion title spots for CaretRight
  const [links, setLinks] = useState([]) // link spots for LinkBadge
  const [dates, setDates] = useState([]) // date spots for DateBadge
  const [grips, setGrips] = useState([]) // list item spots for ListGrip
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

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

  const spans = useMemo(() => linkSpans(content), [content])
  const linkEdits = useLinkEdits(content, onChange)
  const [html, imagePaths, lists] = useMemo(() => {
    const sanitized = DOMPurify.sanitize(renderBlocks(content))
    const tpl = document.createElement('template')
    tpl.innerHTML = sanitized
    linkSpots(tpl.content, path, files, spans)
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
    const lists = onChange ? listGrips(tpl.content, content) : []
    return [tpl.innerHTML, repoImages(tpl.content, path).map(([, repoPath]) => repoPath), lists]
  }, [content, path, files, spans, Boolean(onChange)])

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
    setLinks([...ref.current.querySelectorAll('.link-spot')])
    setDates([...ref.current.querySelectorAll('.date-spot')])
    setGrips([...ref.current.querySelectorAll('.list-grip')])
  }, [withImages])

  // Always up-to-date handler without re-attaching the listener
  linkHandlerRef.current = (e) => {
    const link = e.target.closest('a')
    if (!link?.closest('.editor-preview, .md-inline')) return // the note, or its properties' descriptions (InlineMarkdown)
    const href = link.getAttribute('href')
    if (!href || href.startsWith('#')) return
    e.preventDefault()
    openLink(href, {
      path, files, onOpenFile, onNavigate,
      onBroken: () => {
        clearTimeout(tipTimer.current)
        setBrokenTip({ x: e.clientX, y: e.clientY })
        tipTimer.current = setTimeout(() => setBrokenTip(null), 2000)
      },
    })
  }

  // Capture-phase native listener intercepts link clicks before browser navigation
  useEffect(() => {
    const el = scrollRef.current
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
    if (e.target.closest('a, img, summary, .link-spot, .list-grip')) return // summary opens/closes its accordion
    if (isDoubleTap(e)) onDoubleTap?.(offsetAt(e.clientX, e.clientY, e.target))
  }

  // Counted here rather than with dblclick, which iPhones don't send on a
  // double tap; it must run inside the tap so the keyboard opens
  function isDoubleTap(e) {
    const prev = lastTap.current
    const now = { time: e.timeStamp, x: e.clientX, y: e.clientY }
    const double = prev && now.time - prev.time < DOUBLE_TAP_MS
      && Math.hypot(now.x - prev.x, now.y - prev.y) < DOUBLE_TAP_PX
    lastTap.current = double ? null : now
    return double
  }

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      {/* What's above the note (its properties, from the front matter at the top of the file): a double tap edits from the start */}
      {children && <div onClick={e => { if (!isPortaled(e) && !e.target.closest('a') && isDoubleTap(e)) onDoubleTap?.(0) }}>{children}</div>}
      <div
        ref={ref}
        className="editor-preview min-w-0 break-words p-space text-base leading-relaxed touch-manipulation [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: withImages || '<p class="text-muted-foreground italic">Nothing to preview yet.</p>' }}
      />
      {carets.map((spot, i) => createPortal(<CaretRight />, spot, i))}
      {links.map((spot, i) => {
        const { href, text, kind, path: target } = spot.dataset
        const span = spans[spot.dataset.span]
        return createPortal(
          <LinkBadge href={href} text={text} kind={kind} path={target} {...linkEdits.actions(span, text)} />, spot, `link-${i}`)
      })}
      {dates.map((spot, i) => createPortal(<DateBadge label={spot.dataset.label} />, spot, `date-${i}`))}
      <DndContext
        sensors={sensors}
        collisionDetection={ownList}
        onDragEnd={({ active, over }) => {
          const [list, from] = active.id.split(':').map(Number)
          const to = over && over.data.current?.list === list ? Number(over.id.split(':')[1]) : from
          if (to !== from) onChange(moveListItem(content, lists[list], from, to))
        }}
      >
        {lists.map((list, l) => (
          <SortableContext key={l} items={list.items.map((_, i) => `${l}:${i}`)} strategy={verticalListSortingStrategy}>
            {grips.filter(g => Number(g.dataset.list) === l).map(spot => createPortal(<ListGrip spot={spot} id={`${l}:${spot.dataset.item}`} list={l} />, spot, `grip-${l}-${spot.dataset.item}`))}
          </SortableContext>
        ))}
      </DndContext>
      {linkEdits.dialogs}
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
