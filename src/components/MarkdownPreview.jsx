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
import TableColumn from './TableColumn.jsx'
import TableCell from './TableCell.jsx'
import { detectType, tableRows, withCells, sortedRows, cellPasses, columnValues, cellValues, checkboxText } from '../lib/tables.js'
import { useTablesContext } from '../hooks/useTables.js'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
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

// A dragged item's copy only goes up and down
const upAndDown = ({ transform }) => ({ ...transform, x: 0 })

// The copy of a dragged item or block that follows the pointer (DragOverlay): its HTML as the preview shows it, a list
// item inside a list of its kind so it keeps its marker
function ghostHtml(item) {
  const copy = item.cloneNode(true)
  copy.classList.remove('list-drop-before', 'list-drop-after')
  copy.querySelectorAll('.block-grip, .list-grip').forEach(g => g.remove()) // its handles stay behind
  if (item.tagName !== 'LI') return copy.outerHTML
  const list = item.parentElement
  const start = list.tagName === 'OL' ? ` start="${(Number(list.getAttribute('start')) || 1) + [...list.children].indexOf(item)}"` : ''
  return `<${list.tagName.toLowerCase()}${start} class="${list.className}">${copy.outerHTML}</${list.tagName.toLowerCase()}>`
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

// A table cell's text as read: its link and date badges' spots count as what they show
function cellText(cell) {
  const copy = cell.cloneNode(true)
  copy.querySelectorAll('.link-spot').forEach(s => s.replaceWith(s.dataset.text ?? ''))
  copy.querySelectorAll('.date-spot').forEach(s => s.replaceWith(s.dataset.label ?? ''))
  return copy.textContent.trim()
}

// A cell that is only a link
const onlyLink = cell => cell.querySelectorAll('.link-spot').length === 1 && !cell.textContent.trim()

const CELL_TYPES = ['select', 'multi', 'date', 'checkbox'] // shown as badges or a checkbox in the cell's place

// Every table with a header gets a `.table-column` spot in each header cell (TableColumn: `data-table`, the table's
// index among the note's tables, `data-col`); a select's, multi-select's, date's or checkbox's cell gets a `.table-cell`
// spot in place of its text (TableCell: `data-row`, its body row); a number's is aligned right. A column's type is the
// one picked for its name (`picked`: lib/tables.js), else what its cells look like. Returns, per table index,
// { columns: [{ name, type, detected, picked }], texts: each body row's cells' text, edit } (each body row's `data-row` its index; null for a table left
// out); `edit` ({ start, raw }: where the table's markdown is in `content`) only when its rows line up with the markdown's
function tableColumns(root, content, picked) {
  return [...root.querySelectorAll('table')].map((table, t) => {
    const heads = [...(table.tHead?.rows[0]?.cells ?? [])]
    const rows = [...(table.tBodies[0]?.rows ?? [])]
    if (!heads.length || !rows.length) return null
    const cells = rows.map(tr => [...tr.cells].map(td => ({ text: cellText(td), link: onlyLink(td) })))
    const block = table.closest('[data-src]')
    const start = Number(block?.dataset.src)
    const raw = block ? content.slice(start, start + Number(block.dataset.len)) : ''
    const md = block?.querySelectorAll('table').length === 1 && tableRows(raw)
    const columns = heads.map((th, c) => {
      const name = cellText(th)
      const detected = detectType(cells.map(r => r[c] ?? { text: '', link: false }))
      const chosen = picked[name]?.type
      th.insertAdjacentHTML('beforeend', `<span class="table-column" data-table="${t}" data-col="${c}"></span>`)
      return { name, type: chosen ?? detected, detected, picked: chosen }
    })
    rows.forEach((tr, r) => { tr.dataset.row = r })
    rows.forEach((tr, r) => [...tr.cells].forEach((td, c) => {
      const type = columns[c]?.type
      if (type === 'number') td.classList.add('table-number')
      if (CELL_TYPES.includes(type)) td.innerHTML = `<span class="table-cell" data-table="${t}" data-row="${r}" data-col="${c}"></span>`
    }))
    return { columns, texts: cells.map(r => r.map(c => c.text)), edit: md && md.length === rows.length ? { start, raw } : null }
  })
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
  const [ghost, setGhost] = useState(null) // the dragged item's HTML, for its copy under the pointer
  const [blockSpots, setBlockSpots] = useState([]) // block spots for ListGrip
  const [handles, setHandles] = useState([]) // image spots for ImageHandle
  const [columnSpots, setColumnSpots] = useState([]) // table header spots for TableColumn
  const [cellSpots, setCellSpots] = useState([]) // table cell spots for TableCell
  const [tableViews, setTableViews] = useState({}) // { table: { sort: { col, dir }, filters: { col: filter } } }, while the note is open
  const tableSettings = useTablesContext()
  const pickedNow = tableSettings.of(path)
  const pickedKey = JSON.stringify(pickedNow)
  const picked = useMemo(() => pickedNow, [pickedKey]) // the note's columns' picked types and colors, a new object only when they change
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
  const [html, imagePaths, lists, blocks, tables] = useMemo(() => {
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
    const tables = tableColumns(tpl.content, content, picked)
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
    return [tpl.innerHTML, repoImages(tpl.content, path).map(([, repoPath]) => repoPath), lists, blocks, tables]
  }, [content, path, files, spans, Boolean(onChange), picked])

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
    setColumnSpots([...ref.current.querySelectorAll('.table-column')])
    setCellSpots([...ref.current.querySelectorAll('.table-cell')])
  }, [withImages])

  useEffect(() => setTableViews({}), [path]) // another note: no sorting or filters

  // Rows sorted by a column, those a filter leaves out hidden; a table with none left says so in a row of its own
  useLayoutEffect(() => {
    ref.current.querySelectorAll('table').forEach((table, t) => {
      const data = tables[t]
      const body = table.tBodies[0]
      if (!data || !body) return
      body.querySelector('.table-filter-empty')?.remove()
      const rows = [...body.rows].sort((a, b) => a.dataset.row - b.dataset.row) // in the note's order, whatever a sort did
      const view = tableViews[t] ?? {}
      const column = c => data.texts.map(r => r[c] ?? '')
      const order = view.sort && data.columns[view.sort.col] ? sortedRows(data.columns[view.sort.col].type, column(view.sort.col), view.sort.dir) : rows.map((_, r) => r)
      order.forEach(r => body.append(rows[r]))
      rows.forEach((tr, r) => {
        tr.hidden = !Object.entries(view.filters ?? {}).every(([c, f]) => !data.columns[c] || cellPasses(data.columns[c].type, data.texts[r][c] ?? '', f))
      })
      if (rows.every(tr => tr.hidden)) {
        body.insertAdjacentHTML('beforeend', `<tr class="table-filter-empty"><td colspan="${data.columns.length}">No rows match the filters.</td></tr>`)
      }
    })
  }, [withImages, tables, tableViews])

  // `content` with a table's cells written (`edits`: [{ row, col, text }])
  const writeCells = (t, edits) => {
    const { start, raw } = tables[t].edit
    onChange(content.slice(0, start) + withCells(raw, edits) + content.slice(start + raw.length))
  }
  const setView = (t, edit) => setTableViews(v => ({ ...v, [t]: edit(v[t] ?? {}) }))

  // What a typed column's cells need (TableCell): its values, colors and counts, and, with `onChange`, its values'
  // removal and renaming in every row (and their colors, saved for the note's column)
  function columnOf(t, c) {
    const { columns, texts, edit } = tables[t]
    const { name, type } = columns[c]
    const cells = texts.map(r => r[c] ?? '')
    const has = (text, v) => type === 'multi' ? cellValues(text).includes(v) : text.trim() === v
    const rewrite = (from, to) => writeCells(t, cells.flatMap((text, row) => !has(text, from) ? [] : [{
      row, col: c, text: type === 'multi' ? [...new Set(cellValues(text).map(x => x === from ? to : x).filter(Boolean))].join(', ') : to,
    }]))
    const editable = onChange && edit
    return {
      options: columnValues(type, cells),
      colors: picked[name]?.colors ?? {},
      count: v => cells.filter(text => has(text, v)).length,
      checkboxText: checked => checkboxText(cells, checked),
      onRemoveValue: editable && (v => rewrite(v, '')),
      onEditValue: editable && tableSettings.onColor && ((from, to, color) => {
        if (to !== from) rewrite(from, to)
        tableSettings.onColor(path, name, to, color, to !== from ? from : undefined)
      }),
    }
  }

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
    if (e.target.closest('a, img, summary, .link-spot, .list-grip, .block-grip, .image-handle, .table-column, .table-cell, .table-filter-empty')) return // summary opens/closes its accordion
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
        onDragStart={e => setGhost(ghostHtml(e.active.data.current.item))}
        onDragMove={e => setDrop(e.over && e.over.id !== e.active.id ? { id: e.over.id, side: dropAfter(e) ? 'after' : 'before' } : null)}
        onDragCancel={() => { setDrop(null); setGhost(null) }}
        onDragEnd={e => {
          setDrop(null)
          setGhost(null)
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
        <DragOverlay modifiers={[upAndDown]} dropAnimation={null}>
          {ghost && <div className="editor-preview drag-ghost leading-relaxed text-base" dangerouslySetInnerHTML={{ __html: ghost }} />}
        </DragOverlay>
      </DndContext>
      {columnSpots.map(spot => {
        const { table: t, col: c } = spot.dataset
        const col = tables[t]?.columns[c]
        if (!col) return null
        const view = tableViews[t] ?? {}
        const cells = tables[t].texts.map(r => r[c] ?? '')
        return createPortal(
          <TableColumn
            name={col.name} type={col.type} detected={col.detected} picked={col.picked}
            onType={tableSettings.onType && (type => { tableSettings.onType(path, col.name, type); setView(t, v => ({ ...v, filters: { ...v.filters, [c]: null } })) })}
            sort={view.sort?.col === Number(c) ? view.sort.dir : null}
            onSort={dir => setView(t, v => ({ ...v, sort: dir ? { col: Number(c), dir } : null }))}
            filter={view.filters?.[c]} onFilter={f => setView(t, v => ({ ...v, filters: { ...v.filters, [c]: f } }))}
            values={['select', 'multi'].includes(col.type) ? columnValues(col.type, cells).map(value => ({ value, count: cells.filter(x => col.type === 'multi' ? cellValues(x).includes(value) : x.trim() === value).length })) : []}
          />, spot, `column-${t}-${c}`)
      })}
      {cellSpots.map(spot => {
        const { table: t, row: r, col: c } = spot.dataset
        const col = tables[t]?.columns[c]
        if (!col) return null
        return createPortal(
          <TableCell
            type={col.type} name={col.name} text={tables[t].texts[r][c] ?? ''} column={columnOf(t, c)}
            onChange={onChange && tables[t].edit ? text => writeCells(t, [{ row: Number(r), col: Number(c), text }]) : undefined}
          />, spot, `cell-${t}-${r}-${c}`)
      })}
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
