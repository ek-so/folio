import DOMPurify from 'dompurify'

// HTML from a note (rendered markdown, and any HTML written in it) made safe to show inside the app. DOMPurify takes out
// scripts, event handlers and javascript: links; on top of that, a note is someone else's text (a collaborator's, a
// merged pull request's), so it can't imitate the app: no forms or controls (a fake "sign in again" asking for the
// token), only a task's checkbox stays, and no style that lifts it out of the note (fixed or absolute position, a place
// on the screen, a layer above the app). Colors, sizes and the rest of a style stay.
const CONTROLS = ['form', 'button', 'select', 'textarea', 'option', 'optgroup', 'fieldset', 'datalist', 'output', 'dialog']
const LIFTING = /^(position|inset|inset-[a-z-]+|top|right|bottom|left|z-index|translate|transform)$/i

// A style attribute without the declarations that would place the element outside the note's flow
export function contained(style) {
  return style.split(';').filter(d => {
    const name = d.slice(0, d.indexOf(':')).trim()
    return d.includes(':') && !LIFTING.test(name)
  }).map(d => d.trim()).join('; ')
}

let hooked = false
function hook() {
  if (hooked) return
  hooked = true
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'input' && node.getAttribute('type') !== 'checkbox') node.remove()
  })
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName === 'style') data.attrValue = contained(data.attrValue)
  })
}

export function safeHtml(html) {
  hook()
  return DOMPurify.sanitize(html, { FORBID_TAGS: CONTROLS, FORBID_ATTR: ['form', 'formaction'] })
}
