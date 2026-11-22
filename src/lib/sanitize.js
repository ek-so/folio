import DOMPurify from 'dompurify'

// HTML from a note (rendered markdown, and any HTML written in it) made safe to show inside the app. DOMPurify takes out
// scripts, event handlers and javascript: links; on top of that, a note is someone else's text (a collaborator's, a
// merged pull request's), so it can't imitate the app: no forms or controls (a fake "sign in again" asking for the
// token), only a task's checkbox stays, no style sheets, none of the app's own classes (its utilities would place it
// anywhere: `fixed inset-0 z-50`), and no style that lifts it out of the note (fixed or absolute position, a place on the
// screen, a layer above the app). Colors, sizes and the rest of a style stay.
const CONTROLS = ['form', 'button', 'select', 'textarea', 'option', 'optgroup', 'fieldset', 'datalist', 'output', 'dialog', 'style']
const LIFTING = /^(position|inset|inset-[a-z-]+|top|right|bottom|left|z-index|translate|transform)$/i
// A property's name as written plainly; one with an escape or anything else in it (`p\osition`) is dropped, as the
// browser could read it as one of the above
const PLAIN_NAME = /^-{0,2}[a-z][a-z0-9-]*$/i
// The classes Folio's own markdown rendering gives (lib/markdown.js: callouts, a list item's gap, date spots; marked's
// code language); any other class in a note is dropped
const OWN_CLASS = /^(callout(-[a-z]+)?|gap-after|date-spot|language-[\w-]+)$/

// A style attribute without the declarations that would place the element outside the note's flow. Comments go first
// (`position/**/: fixed` is still a position; an unclosed one runs to the end, as in the browser)
export function contained(style) {
  return style.replace(/\/\*[\s\S]*?(\*\/|$)/g, '').split(';').filter(d => {
    const name = d.slice(0, d.indexOf(':')).trim()
    return d.includes(':') && PLAIN_NAME.test(name) && !LIFTING.test(name)
  }).map(d => d.trim()).join('; ')
}

// A class attribute with only Folio's own classes
export const ownClasses = value => value.split(/\s+/).filter(c => OWN_CLASS.test(c)).join(' ')

let hooked = false
function hook() {
  if (hooked) return
  hooked = true
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'input' && node.getAttribute('type') !== 'checkbox') node.remove()
  })
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName === 'style') data.attrValue = contained(data.attrValue)
    if (data.attrName === 'class') data.attrValue = ownClasses(data.attrValue)
  })
}

export function safeHtml(html) {
  hook()
  return DOMPurify.sanitize(html, { FORBID_TAGS: CONTROLS, FORBID_ATTR: ['form', 'formaction'] })
}
