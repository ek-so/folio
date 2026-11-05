import * as React from 'react'
import { cn } from '@/lib/utils'

// A small rounded label (a note's property in its preview and on board cards); long text is cut
// Takes a ref, so it can carry a tooltip (Tip)
export const Badge = React.forwardRef(function Badge({ className, children, ...props }, ref) {
  return (
    <span ref={ref} className={cn('inline-flex min-w-0 max-w-full items-center gap-1 rounded-sm bg-secondary px-2.5 py-1 text-sm text-secondary-foreground', className)} {...props}>
      {children}
    </span>
  )
})
