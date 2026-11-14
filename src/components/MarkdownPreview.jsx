import { useMemo, useEffect, useLayoutEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { safeHtml } from '../lib/sanitize.js'
import { renderBlocks, tapOffset, taskOffsets, resolveImage, linkSpans, splitImageAlt, imageSpans, withImageWidth, listsIn, moveListItem, moveBlock, firstWord } from '../lib/markdown.js'
import { useRepoImages } from '../hooks/useRepoImages.js'
import { linkSpots, openLink } from '../lib/previewLinks.js'
import { cn, isPortaled } from '../lib/utils.js'
import { CaretRight } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'
import LinkBadge from './LinkBadge.jsx'
import { DateField } from './DateBadge.jsx'
import { useDateEdits } from '../hooks/useDateEdits.js'
import { useLinkEdits } from '../hooks/useLinkEdits.jsx'
import ListGrip from './ListGrip.jsx'
import ImageHandle from './ImageHandle.jsx'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { useDragSensors } from '../hooks/useDragSensors.js'

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

// A rendered list item's first word: its link and date badges' spots count as their typed text, its sub-lists don't
function itemWord(li) {
  const copy = li.cloneNode(true)
  copy.querySelectorAll('ul, ol').forEach(l => l.remove())
  copy.querySelectorAll('.link-spot').forEach(s => s.replaceWith(s.dataset.text))
  copy.querySelectorAll('.date-spot').forEach(s => s.replaceWith(s.dataset.raw))
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

// Every top-level block (paragraph, heading, list, quote, code, accordion…) gets a `.block-grip` spot to drag it by
// (ListGrip, in the note's left gutter: App.css), `data-item` its index; returns the blocks' markdown spans
function blockGrips(root) {
  return [...root.children].filter(el => el.matches('[data-src]')).map((block, i) => {
    block.insertAdjacentHTML('afterbegin', `<span class="block-grip" data-item="${i}"></span>`)
    const start = Number(block.dataset.src)
    return { start, end: start + Number(block.dataset.len) }
  })
}

const BLOCKS = 'blocks' // the blocks' ids ("blocks:3"), beside the lists' ("2:1": list, item)

// A dragged list item lands next to any item of the note but its own sub-items, a block next to another block
const otherOfKind = args => {
  const { active } = args
  const block = String(active.id).startsWith(BLOCKS)
  return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(c => String(c.id).startsWith(BLOCKS) === block && (block || !active.data.current.item.contains(c.node.current) || c.node.current === active.data.current.item)) })
}

// Below the middle of the item or block it is over, a dragged one lands after it, else before
const dropAfter = ({ active, over }) => {
  const moved = active.rect.current.translated
  return Boolean(moved && over) && moved.top + moved.height / 2 > over.rect.top + over.rect.height / 2
}

// `content` with what was dragged (`active`, a block or list item) moved next to what it was dropped on (`over`)
function dropped(content, lists, blocks, active, over, after) {
  const [kind, from] = String(active.id).split(':')
  const [, to] = String(over.id).split(':')
  if (kind === BLOCKS) {
    const at = Number(to) + (after ? 1 : 0)
    return moveBlock(content, blocks, Number(from), Number(from) < at ? at - 1 : at)
  }
  return moveListItem(content, lists, [Number(kind), Number(from)], String(over.id).split(':').map(Number), after)
}

// <img> elements in `root` that show repo files: [img, repo path]
const repoImages = (root, notePath) => [...root.querySelectorAll('img')]
  .map(img => [img, resolveImage(notePath, img.getAttribute('src'))])
  .filter(([, repoPath]) => repoPath !== null)

// Rendered note, read-only apart from task checkboxes, links' Edit link / Remove and dragging
// list items, and the note's blocks, into another order (with `onChange`). Double-tapping (or
// double-clicking) text calls onDoubleTap with the markdown offset of the
// tapped word (empty space: the end of the note).
// On mount, scrolls the block holding `scrollTo` (a markdown
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
  const [drop, setDrop] = useState(null) // { id, side } of the item a list item is being dragged over
  const [blockSpots, setBlockSpots] = useState([]) // block spots for ListGrip
  const [handles, setHandles] = useState([]) // image spots for ImageHandle
  const sensors = useDragSensors()

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
  const dateProps = useDateEdits(content, onChange)
  const [html, imagePaths, lists, blocks] = useMemo(() => {
    const sanitized = safeHtml(renderBlocks(content))
    const tpl = document.createElement('template')
    tpl.innerHTML = sanitized
    linkSpots(tpl.content, path, files, spans)
    breakLongWords(tpl.content)
    // Task list items: remove bullet, enable checkbox, record markdown offset
    for (const cb of tpl.content.querySelectorAll('input[type="checkbox"]')) {
      cb.closest('li')?.classList.add('task-item')
      if (onChange) cb.removeAttribute('disabled') // without onChange (a picture of a note) they can't be ticked
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
    const blocks = onChange ? blockGrips(tpl.content) : []
    // Images: the width in their alt text ("photo|300") is applied and taken out of the alt; with `onChange`, each in
    // a frame with a spot for its resize handle, where the page's images line up with the markdown's (not in a link)
    const imgs = [...tpl.content.querySelectorAll('img')]
    const aligned = onChange && imgs.length === imageSpans(content).length
    imgs.forEach((img, i) => {
      const { alt, width } = splitImageAlt(img.getAttribute('alt') ?? '')
      img.setAttribute('alt', alt)
      if (width) img.style.width = `${width}px`
      if (!aligned || img.closest('a')) return
      const frame = document.createElement('span')
      frame.className = 'image-frame'
      img.replaceWith(frame)
      frame.append(img)
      frame.insertAdjacentHTML('beforeend', `<span class="image-handle" data-image="${i}"></span>`)
    })
    return [tpl.innerHTML, repoImages(tpl.content, path).map(([, repoPath]) => repoPath), lists, blocks]
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
    setBlockSpots([...ref.current.querySelectorAll('.block-grip')])
    setHandles([...ref.current.querySelectorAll('.image-handle')])
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

  // Markdown offset for a tap: the tapped block, at the tapped word (a date badge: at its date). Before
  // it, date badges count as what's typed, as in the markdown
  function offsetAt(x, y, target) {
    const block = target.closest('[data-src]')
    if (!block) return content.length
    const start = Number(block.dataset.src)
    const raw = content.slice(start, start + Number(block.dataset.len))
    const caret = caretAt(x, y)
    if (!caret || !block.contains(caret.node)) return start
    const date = (caret.node.nodeType === Node.ELEMENT_NODE ? caret.node : caret.node.parentElement)?.closest('.date-spot')
    const before = document.createRange()
    before.setStart(block, 0)
    if (date) before.setEndBefore(date)
    else before.setEnd(caret.node, caret.offset)
    const typed = before.cloneContents()
    typed.querySelectorAll('.date-spot').forEach(s => s.replaceWith(s.dataset.raw))
    const textAfter = date ? date.dataset.raw : caret.node.nodeType === Node.TEXT_NODE ? caret.node.textContent.slice(caret.offset) : ''
    return start + tapOffset(raw, typed.textContent, textAfter)
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
    if (e.target.closest('a, img, summary, .link-spot, .list-grip, .block-grip, .image-handle')) return // summary opens/closes its accordion
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
    <div
      ref={scrollRef} className={'flex-1 min-h-0 overflow-x-hidden overflow-y-auto'}
      // The empty space under a short note: a double tap edits from its end
      onClick={e => { if (e.target === e.currentTarget && isDoubleTap(e)) onDoubleTap?.(content.length) }}
    >
      {/* What's above the note (its properties, from the front matter at the top of the file): a double tap edits from the start */}
      {children && <div onClick={e => { if (!isPortaled(e) && !e.target.closest('a') && isDoubleTap(e)) onDoubleTap?.(0) }}>{children}</div>}
      <div
        ref={ref}
        className={cn('editor-preview min-w-0 break-words leading-relaxed touch-manipulation [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md', 'p-space text-base')}
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
      {dates.map((spot, i) => createPortal(<DateField inline label={spot.dataset.label} onClick={handleClick} {...dateProps(spot, i)} />, spot, `date-${i}`))}
      <DndContext
        sensors={sensors}
        collisionDetection={otherOfKind}
        onDragMove={e => setDrop(e.over ? { id: e.over.id, side: dropAfter(e) ? 'after' : 'before' } : null)}
        onDragCancel={() => setDrop(null)}
        onDragEnd={e => {
          setDrop(null)
          if (!e.over) return
          const moved = dropped(content, lists, blocks, e.active, e.over, dropAfter(e))
          if (moved !== content) onChange(moved)
        }}
      >
        {blockSpots.map(spot => {
          const id = `${BLOCKS}:${spot.dataset.item}`
          return createPortal(<ListGrip spot={spot} id={id} drop={drop?.id === id ? drop.side : null} />, spot, `block-${spot.dataset.item}`)
        })}
        {grips.map(spot => {
          const id = `${spot.dataset.list}:${spot.dataset.item}`
          return createPortal(<ListGrip spot={spot} id={id} drop={drop?.id === id ? drop.side : null} />, spot, `grip-${id}`)
        })}
      </DndContext>
      {handles.map(spot => createPortal(
        <ImageHandle spot={spot} onResize={width => onChange(withImageWidth(content, imageSpans(content)[Number(spot.dataset.image)], width))} />, spot, `image-${spot.dataset.image}`))}
      {linkEdits.dialogs}
      {footer}
      {brokenTip && (
        <div
          className="fixed z-50 rounded-sm border border-border bg-popover text-foreground text-sm px-space-sm py-space-xs shadow-md pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: brokenTip.x, top: brokenTip.y - 6 }}
        >
          Link is broken
        </div>
      )}
    </div>
  )
})

export default MarkdownPreview
