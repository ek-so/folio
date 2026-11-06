import { cn } from '@/lib/utils'

// What stands in for something not filled in yet (“Untitled”, “No value”): light, like a disabled control, until it is
export function Placeholder({ className, children }) {
  return <span className={cn('text-muted-foreground/70', className)}>{children}</span>
}
