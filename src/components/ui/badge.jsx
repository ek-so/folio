import { cn } from '@/lib/utils'

// A small rounded label (a note's property in its preview and on board cards); long text is cut
export function Badge({ className, children, ...props }) {
  return (
    <span className={cn('inline-flex min-w-0 max-w-full items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 text-xs text-secondary-foreground', className)} {...props}>
      {children}
    </span>
  )
}
