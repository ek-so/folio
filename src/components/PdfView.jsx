import { useEffect, useRef, useState } from 'react'
import Spinner from './Spinner.jsx'
import { EmptyMessage } from './EmptyState.jsx'

// Loaded on first use, so the app itself stays small
const loadPdfjs = () => Promise.all([
  import('pdfjs-dist'),
  import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
]).then(([pdfjs, worker]) => {
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  return pdfjs
})

function toBytes(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

// How far beyond the screen pages are drawn; further ones are released,
// because iOS limits the memory all canvases may use together
const NEAR = '100% 0px'

// Every page of a PDF, one under another, fitted to the width. Each page
// keeps its size; only pages near the screen are drawn.
export default function PdfView({ base64 }) {
  const scrollRef = useRef()
  const pagesRef = useRef()
  const [width, setWidth] = useState(0)
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    const el = pagesRef.current
    const observer = new ResizeObserver(() => setWidth(Math.round(el.clientWidth)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!width) return
    let cancelled = false
    let task
    let doc
    let observer
    const container = pagesRef.current

    async function draw(slot) {
      if (slot.canvas) return
      const page = await doc.getPage(slot.n)
      const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width * window.devicePixelRatio })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.className = 'size-full'
      slot.canvas = canvas
      slot.task = page.render({ canvas, viewport })
      try {
        await slot.task.promise
        if (slot.canvas === canvas) slot.el.replaceChildren(canvas)
      } catch { /* cancelled while scrolling past */ }
    }

    function release(slot) {
      slot.task?.cancel()
      if (slot.canvas) slot.canvas.width = slot.canvas.height = 0 // frees the memory on iOS
      slot.canvas = slot.task = null
      slot.el.replaceChildren()
    }

    ;(async () => {
      try {
        const pdfjs = await loadPdfjs()
        task = pdfjs.getDocument({ data: toBytes(base64) })
        doc = await task.promise
        const slots = []
        for (let n = 1; n <= doc.numPages; n++) {
          const { width: w, height: h } = (await doc.getPage(n)).getViewport({ scale: 1 })
          if (cancelled) return
          const el = document.createElement('div')
          el.className = 'w-full overflow-hidden rounded-md bg-card shadow-sm'
          el.style.aspectRatio = `${w} / ${h}`
          slots.push({ n, el })
        }
        container.replaceChildren(...slots.map(s => s.el))
        observer = new IntersectionObserver(entries => {
          for (const e of entries) {
            const slot = slots.find(s => s.el === e.target)
            if (e.isIntersecting) draw(slot)
            else release(slot)
          }
        }, { root: scrollRef.current, rootMargin: NEAR })
        slots.forEach(s => observer.observe(s.el))
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => { cancelled = true; observer?.disconnect(); task?.destroy() }
  }, [base64, width])

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-space">
      {status === 'loading' && <div className="flex justify-center py-12"><Spinner /></div>}
      {status === 'error' && <EmptyMessage size="lg" className="px-space">Couldn't show this PDF.</EmptyMessage>}
      <div ref={pagesRef} className="flex flex-col gap-space" />
    </div>
  )
}
