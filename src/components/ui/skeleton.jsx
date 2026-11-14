import { cn } from '@/lib/utils'

// shadcn Skeleton: a pulsing muted block standing in for content that's loading (muted, not shadcn's
// accent, which is a color in our theme)
function Skeleton({ className, ...props }) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn('animate-pulse rounded-md bg-muted motion-reduce:animate-none', className)} {...props} />
}

export { Skeleton }
