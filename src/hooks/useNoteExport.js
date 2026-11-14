import { toast } from 'sonner'
import { exportName, exportPage, exportText } from '../lib/export.js'
import { splitName } from '../lib/changes.js'

// The item ⋯'s Export of a note: `textOf(path)` gives its latest text (undefined when it isn't on this device).
// 'pdf' prints it (the browser's print dialog, where it can be saved as PDF); 'txt' downloads it as plain text.
export function useNoteExport(textOf) {
  return (item, format) => {
    const text = textOf(item.path)
    if (text === undefined) return toast.error("This note isn't on this device yet. Try again once it has downloaded.")
    const [fallback] = splitName(item.name)
    if (format === 'txt') save(new Blob([exportText(text, fallback)], { type: 'text/plain;charset=utf-8' }), exportName(item.name, 'txt'))
    else print(exportPage(text, fallback), fallback)
  }
}

function save(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// While printing, only the note shows: the app is hidden and the page put in its place (in a shadow root, untouched by
// the app's styles). Printed from this window, right in the tap, as some browsers (Safari, an installed app) print
// nothing from a frame or after the tap. The page's title names the PDF.
const PAGE_STYLE = `
@media screen { #folio-print { display: none; } }
@media print {
  @page { margin: 2cm; }
  html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
  body > :not(#folio-print) { display: none !important; }
}`

function print(html, name) {
  const style = Object.assign(document.createElement('style'), { textContent: PAGE_STYLE })
  const host = Object.assign(document.createElement('div'), { id: 'folio-print' })
  host.attachShadow({ mode: 'open' }).innerHTML = html
  const title = document.title
  document.head.append(style)
  document.body.append(host)
  document.title = name
  let done = false
  const cleanup = () => {
    if (done) return
    done = true
    style.remove()
    host.remove()
    document.title = title
    window.removeEventListener('afterprint', cleanup)
    window.removeEventListener('pointerdown', cleanup, true)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
  // Where print() doesn't wait for the dialog and afterprint never comes: once the app is used again
  setTimeout(() => window.addEventListener('pointerdown', cleanup, true))
}
