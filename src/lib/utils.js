import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge knows the app's own spacing tokens (index.css: control sizes
// and layout spacing), so `h-auto` replaces `h-control`, `gap-space` replaces
// `gap-space-sm`, and so on, instead of both landing in the class list.
const twMerge = extendTailwindMerge({
  extend: { theme: { spacing: ['control', 'control-md', 'control-sm', 'space', 'space-sm', 'space-xs', 'space-lg'] } },
})

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
