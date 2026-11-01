import { useEffect, useRef, useState } from 'react'
import Spinner from './Spinner.jsx'

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

// Every page of a PDF, one under another, fitted to the width.
export default function PdfView({ base64 }) {
  const containerRef = useRef()
  const [width, setWidth] = useState(0)
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    const el = containerRef.current
    const observer = new ResizeObserver(() => setWidth(Math.round(el.clientWidth)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!width) return
    let cancelled = false
    let doc
    const pages = containerRef.current
    ;(async () => {
      try {
        const pdfjs = await loadPdfjs()
        doc = await pdfjs.getDocument({ data: toBytes(base64) }).promise
        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelled) return
          const page = await doc.getPage(n)
          const scale = width / page.getViewport({ scale: 1 }).width
          const viewport = page.getViewport({ scale: scale * window.devicePixelRatio })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.className = 'w-full h-auto rounded-md bg-white shadow-sm'
          await page.render({ canvas, viewport }).promise
          if (n === 1 && !cancelled) { pages.replaceChildren(canvas); setStatus('ready') }
          else if (!cancelled) pages.append(canvas)
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => { cancelled = true; doc?.destroy() }
  }, [base64, width])

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
      {status === 'loading' && <div className="flex justify-center py-12"><Spinner /></div>}
      {status === 'error' && <p className="text-muted-foreground text-sm text-center py-12 px-6">Couldn't show this PDF.</p>}
      <div ref={containerRef} className="flex flex-col gap-4" />
    </div>
  )
}
