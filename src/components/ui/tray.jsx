import { forwardRef } from 'react'
import { DotsSixVertical, CaretDown, Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from './button.jsx'
import { Separator } from './separator.jsx'

// A tinted, rounded box that groups what's inside it under a small title: a board's column, a note in the Notes widget.
// `className` and other props go on the box (a column's drag and drop).
export const Tray = forwardRef(function Tray({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col gap-space-sm rounded-xl bg-secondary/60 p-space-sm', className)} {...props} />
})

// A tray's title row: `grip` shows the drag indicator before it (a tray that can be moved)
export function TrayTitle({ grip, children }) {
  return (
    <div className="flex min-h-control-md items-center gap-1 pl-space-sm pr-space-xs">
      {grip && <DotsSixVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
      <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{children}</h3>
    </div>
  )
}

// A tray's own text buttons under its cards (`ghost-quiet`)
export const TRAY_ROW = 'justify-start gap-2 px-3 text-sm font-normal'

// What a tray of cards ends with: Show `more` more (`onShowMore`; nothing when 0), a separator, then `newLabel`
// (`onNew`; `disabled` when it can't be changed). Without `onNew` (a planner: its + is in the title), only Show more. `grid`: inside the cards' grid of columns (a planner's day), each
// button on a row of its own, one column wide, and the separator across them all
export function TrayFooter({ more, onShowMore, newLabel, onNew, disabled, grid }) {
  const row = cn(TRAY_ROW, grid && 'col-start-1 w-full self-start')
  return (
    <>
      {more > 0 && <Button variant="ghost-quiet" className={row} onClick={onShowMore}><CaretDown /> Show {more} more</Button>}
      {more > 0 && onNew && <Separator className={cn('mx-space-xs data-[orientation=horizontal]:w-auto', grid && 'col-span-full')} />}
      {onNew && (
        <Button variant="ghost-quiet" disabled={disabled} className={row} onClick={onNew}>
          <Plus /> {newLabel}
        </Button>
      )}
    </>
  )
}
