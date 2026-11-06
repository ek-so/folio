import { forwardRef } from 'react'
import { DotsSixVertical } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// A tinted, rounded box that groups what's inside it under a small title: a board's column, a note widget's note (no title).
// `className` and other props go on the box (a column's drag and drop).
export const Tray = forwardRef(function Tray({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col gap-space-sm rounded-lg bg-secondary/60 p-space-sm', className)} {...props} />
})

// A medium icon button in a tray's title row (a column's ⋯)
export const TRAY_BUTTON = 'size-control-md shrink-0 text-muted-foreground hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10'

// A tray's title row: `grip` shows the drag indicator before it (a tray that can be moved)
export function TrayTitle({ grip, children }) {
  return (
    <div className="flex min-h-control-md items-center gap-1 pl-space-sm pr-space-xs">
      {grip && <DotsSixVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
      <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{children}</h3>
    </div>
  )
}
