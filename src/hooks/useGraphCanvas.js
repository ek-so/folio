import { useEffect, useRef } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'

// The Graph page's canvas (lib/graph.js data): a force layout (d3-force) drawn on `canvasRef`, which fills its box.
// Drag a dot to move it, drag the background to pan, scroll or pinch to zoom; a tap on a dot calls `onOpen(node)`.
// Hovering a dot (a mouse) brings out it, its lines and their dots. Positions are kept by id when the data changes.
// Colors are the theme's tokens, read at each frame so a theme change shows at once. Until the view is panned, zoomed or
// a dot dragged, it follows the layout as it settles, the whole graph fitted in the canvas (at most at 1.5×).
const RADIUS = { root: 9, folder: 6, note: 4.5, file: 3.5 }
const TAP = 6 // px a pointer can move and still be a tap
const MIN_ZOOM = 0.15, MAX_ZOOM = 4
const FIT_MAX = 1.5, FIT_PAD = 40 // the fitted view's largest zoom, and its margin in px
const LABELS_FROM = 0.9 // zoom from which every dot shows its name (else only the hovered one and its neighbors)

export function useGraphCanvas(canvasRef, data, onOpen) {
  const state = useRef({ nodes: [], edges: [], view: { x: 0, y: 0, k: 1 }, hover: null, size: { w: 0, h: 0 }, touched: false })
  const openRef = useRef(onOpen)
  openRef.current = onOpen
  const simRef = useRef(null)
  const drawRef = useRef(() => {})

  // The canvas: sized to its box (and the screen's pixel density), drawn on each frame the layout moves
  useEffect(() => {
    const canvas = canvasRef.current
    const s = state.current
    let frame = 0
    const draw = () => {
      frame = 0
      if (!s.touched) fit()
      const ctx = canvas.getContext('2d')
      const css = getComputedStyle(canvas)
      const token = name => css.getPropertyValue(name).trim()
      const colors = { note: token('--primary'), file: token('--muted-foreground'), folder: token('--foreground'), root: token('--foreground'), line: token('--muted-foreground'), link: token('--muted-foreground'), text: token('--foreground'), bg: token('--card') }
      const dpr = window.devicePixelRatio || 1
      const { w, h } = s.size
      const { x, y, k } = s.view
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (w / 2 + x), dpr * (h / 2 + y))
      const near = s.hover ? new Set([s.hover.id]) : null
      if (s.hover) for (const e of s.edges) if (e.source === s.hover || e.target === s.hover) { near.add(e.source.id); near.add(e.target.id) }
      const faded = id => near && !near.has(id)
      for (const e of s.edges) {
        const lit = s.hover && (e.source === s.hover || e.target === s.hover)
        ctx.globalAlpha = s.hover && !lit ? 0.15 : lit ? 1 : e.kind === 'link' ? 0.8 : 0.4
        ctx.strokeStyle = lit ? colors.note : e.kind === 'link' ? colors.link : colors.line
        ctx.lineWidth = (lit ? 1.5 : 1) / k
        ctx.setLineDash(e.kind === 'link' ? [4 / k, 3 / k] : [])
        ctx.beginPath()
        ctx.moveTo(e.source.x, e.source.y)
        ctx.lineTo(e.target.x, e.target.y)
        ctx.stroke()
      }
      ctx.setLineDash([])
      const fontSize = 12 / Math.max(k, 0.6)
      ctx.font = `${fontSize}px ${css.fontFamily}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      for (const n of s.nodes) {
        ctx.globalAlpha = faded(n.id) ? 0.15 : 1
        ctx.beginPath()
        ctx.arc(n.x, n.y, RADIUS[n.kind], 0, Math.PI * 2)
        if (n.kind === 'folder' || n.kind === 'root') {
          ctx.fillStyle = colors.bg
          ctx.fill()
          ctx.lineWidth = 1.5 / k
          ctx.strokeStyle = colors.folder
          ctx.stroke()
        } else {
          ctx.fillStyle = colors[n.kind]
          ctx.fill()
        }
        if (k >= LABELS_FROM || (near && near.has(n.id)) || n.kind === 'root') {
          ctx.fillStyle = colors.text
          ctx.globalAlpha = faded(n.id) ? 0.15 : n === s.hover ? 1 : 0.7
          ctx.fillText(n.name, n.x, n.y + RADIUS[n.kind] + 3 / k)
        }
      }
      ctx.globalAlpha = 1
    }
    // The view that shows every dot, centered
    const fit = () => {
      if (!s.nodes.length || !s.size.w) return
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (const n of s.nodes) { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y) }
      const k = Math.max(MIN_ZOOM, Math.min(FIT_MAX, (s.size.w - FIT_PAD * 2) / Math.max(x1 - x0, 1), (s.size.h - FIT_PAD * 2) / Math.max(y1 - y0, 1)))
      s.view = { k, x: -(x0 + x1) / 2 * k, y: -(y0 + y1) / 2 * k }
    }
    const request = () => { if (!frame) frame = requestAnimationFrame(draw) }
    drawRef.current = request

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      s.size = { w: width, h: height }
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      request()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    // Screen point (relative to the canvas) → graph point, and the dot under it
    const toGraph = (px, py) => ({ x: (px - s.size.w / 2 - s.view.x) / s.view.k, y: (py - s.size.h / 2 - s.view.y) / s.view.k })
    const point = e => { const r = canvas.getBoundingClientRect(); return { px: e.clientX - r.left, py: e.clientY - r.top } }
    const nodeAt = (px, py) => {
      const g = toGraph(px, py)
      const slop = 6 / s.view.k
      let best = null, bestD = Infinity
      for (const n of s.nodes) {
        const d = Math.hypot(n.x - g.x, n.y - g.y)
        if (d <= RADIUS[n.kind] + slop && d < bestD) { best = n; bestD = d }
      }
      return best
    }
    const zoomAt = (px, py, factor) => {
      s.touched = true
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s.view.k * factor))
      const g = toGraph(px, py)
      s.view = { k, x: px - s.size.w / 2 - g.x * k, y: py - s.size.h / 2 - g.y * k }
      request()
    }

    const pointers = new Map() // pointerId → { px, py }
    let gesture = null // { node?, start: { px, py }, moved, view?, pinch? }
    const down = e => {
      canvas.setPointerCapture(e.pointerId)
      const p = point(e)
      pointers.set(e.pointerId, p)
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        gesture = { pinch: { d: Math.hypot(a.px - b.px, a.py - b.py), mid: { px: (a.px + b.px) / 2, py: (a.py + b.py) / 2 } }, moved: true }
        return
      }
      const node = nodeAt(p.px, p.py)
      gesture = { node, start: p, moved: false, view: { ...s.view } }
      if (node) { node.fx = node.x; node.fy = node.y }
    }
    const move = e => {
      const p = point(e)
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p)
      if (!gesture) {
        if (e.pointerType !== 'mouse') return
        const node = nodeAt(p.px, p.py)
        if (node !== s.hover) { s.hover = node; canvas.style.cursor = node ? 'pointer' : 'grab'; request() }
        return
      }
      if (gesture.pinch) {
        if (pointers.size < 2) return
        const [a, b] = [...pointers.values()]
        const d = Math.hypot(a.px - b.px, a.py - b.py)
        zoomAt(gesture.pinch.mid.px, gesture.pinch.mid.py, d / gesture.pinch.d)
        gesture.pinch.d = d
        return
      }
      if (!gesture.moved && Math.hypot(p.px - gesture.start.px, p.py - gesture.start.py) < TAP) return
      gesture.moved = true
      s.touched = true
      if (gesture.node) {
        const g = toGraph(p.px, p.py)
        gesture.node.fx = g.x
        gesture.node.fy = g.y
        simRef.current?.alphaTarget(0.3).restart()
      } else {
        s.view = { ...s.view, x: gesture.view.x + p.px - gesture.start.px, y: gesture.view.y + p.py - gesture.start.py }
        canvas.style.cursor = 'grabbing'
        request()
      }
    }
    const up = e => {
      pointers.delete(e.pointerId)
      if (!gesture) return
      const { node, moved, pinch } = gesture
      if (pinch) { if (pointers.size === 0) gesture = null; return }
      gesture = null
      if (node) {
        node.fx = null
        node.fy = null
        simRef.current?.alphaTarget(0)
        if (!moved && e.type === 'pointerup') openRef.current(node)
      }
      if (e.pointerType === 'mouse') canvas.style.cursor = s.hover ? 'pointer' : 'grab'
    }
    const leave = () => { if (s.hover && !gesture) { s.hover = null; request() } }
    const wheel = e => {
      e.preventDefault()
      const p = point(e)
      zoomAt(p.px, p.py, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)))
    }
    canvas.style.cursor = 'grab'
    canvas.style.touchAction = 'none'
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    canvas.addEventListener('pointerleave', leave)
    canvas.addEventListener('wheel', wheel, { passive: false })
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', request)
    const themeObserver = new MutationObserver(request)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
      themeObserver.disconnect()
      media.removeEventListener('change', request)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('pointerleave', leave)
      canvas.removeEventListener('wheel', wheel)
    }
  }, [canvasRef])

  // The layout: the data's nodes (where they were, if they were there) and lines, settling by themselves
  useEffect(() => {
    const s = state.current
    const was = new Map(s.nodes.map(n => [n.id, n]))
    s.nodes = data.nodes.map(n => {
      const old = was.get(n.id)
      return old ? Object.assign(old, n) : { ...n }
    })
    s.edges = data.edges.map(e => ({ ...e }))
    if (s.hover && !s.nodes.includes(s.hover)) s.hover = null
    const sim = forceSimulation(s.nodes)
      .force('link', forceLink(s.edges).id(n => n.id).distance(e => e.kind === 'link' ? 70 : 40).strength(e => e.kind === 'link' ? 0.15 : 0.6))
      .force('charge', forceManyBody().strength(-90))
      .force('center', forceCenter(0, 0).strength(0.05))
      .force('collide', forceCollide(n => RADIUS[n.kind] + 3))
      .on('tick', () => drawRef.current())
    if (was.size) sim.alpha(0.3)
    simRef.current = sim
    return () => sim.stop()
  }, [data])
}
