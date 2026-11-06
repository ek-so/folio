import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge knows the app's own spacing tokens (index.css: control sizes
// and layout spacing), so `h-auto` replaces `h-control`, `gap-space` replaces
// `gap-space-sm`, and so on, instead of both landing in the class list.
const twMerge = extendTailwindMerge({
  extend: { theme: { spacing: ['control', 'control-md', 'control-sm', 'space', 'space-sm', 'space-xs', 'space-lg'] } },
})

// A React event that came from a portal opened inside this element (a dialog, a popover): React passes it up
// through the component tree though it isn't inside the element on the page. A click handler that means "a click
// on me" ignores those
export const isPortaled = e => !e.currentTarget.contains(e.target)

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
