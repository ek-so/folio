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
    else print(exportPage(text, fallback, fallback))
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

// The page printed from a hidden frame, taken away once the dialog closes
function print(html) {
  const frame = Object.assign(document.createElement('iframe'), { srcdoc: html })
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0'
  frame.onload = () => {
    const win = frame.contentWindow
    const done = () => frame.remove()
    win.addEventListener('afterprint', () => setTimeout(done))
    setTimeout(done, 10 * 60 * 1000) // a browser that never says the dialog closed
    win.focus()
    win.print()
  }
  document.body.append(frame)
}
