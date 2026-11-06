import { cn } from '@/lib/utils'

// What stands in for something not filled in yet (“Untitled”, “No value”): light, like a disabled control, until it is.
// PLACEHOLDER is its color, for a whole control that stands in (an empty property's badge)
export const PLACEHOLDER = 'text-muted-foreground/70'

export function Placeholder({ className, children }) {
  return <span className={cn(PLACEHOLDER, className)}>{children}</span>
}
