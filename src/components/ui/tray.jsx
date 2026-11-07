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

// A tray's own text buttons under its cards
export const TRAY_ROW = 'justify-start gap-2 px-3 text-sm font-normal text-muted-foreground hover:bg-muted-foreground/10'

// Show `more` more (`onShowMore`). On its own where the cards sit in a grid of columns, so it takes one column's width
export function TrayShowMore({ more, onShowMore, className }) {
  return <Button variant="ghost" className={cn(TRAY_ROW, className)} onClick={onShowMore}><CaretDown /> Show {more} more</Button>
}

// What a tray of cards ends with: Show `more` more (`onShowMore`; nothing when 0), a separator, then `newLabel`
// (`onNew`; `disabled` when it can't be changed). Without `onShowMore`, Show more is among the cards (TrayShowMore)
// and only its separator is here
export function TrayFooter({ more, onShowMore, newLabel, onNew, disabled }) {
  return (
    <>
      {more > 0 && <>
        {onShowMore && <TrayShowMore more={more} onShowMore={onShowMore} />}
        <Separator className="mx-space-xs data-[orientation=horizontal]:w-auto" />
      </>}
      <Button variant="ghost" disabled={disabled} className={TRAY_ROW} onClick={onNew}>
        <Plus /> {newLabel}
      </Button>
    </>
  )
}
