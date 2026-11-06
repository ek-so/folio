import { forwardRef } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Badge } from './ui/badge.jsx'
import DatePopover from './DatePopover.jsx'

// A date (lib/dates.js) as a badge in the line like a link's: a calendar, then the date as "17 Oct 2026, 14:30"
// (its spot, a <time>, holds the machine-readable date). Other props go on the badge (the preview's tap
// handler: a portal's clicks don't reach the preview on their own)
const DateBadge = forwardRef(function DateBadge({ label, className, ...props }, ref) {
  return (
    <Badge ref={ref} {...props} className={cn('h-control-sm gap-1.5 whitespace-nowrap py-0 pl-2 align-middle text-foreground/75', className)}>
      <CalendarBlank className="size-4 shrink-0 text-primary" />
      {label}
    </Badge>
  )
})
export default DateBadge

// A date badge that, with `onPick(day)` (DatePopover's), opens a calendar to move it to another day; without, plain
export function DateField({ label, date, onPick, className, ...props }) {
  if (!onPick) return <DateBadge label={label} className={className} {...props} />
  return (
    <DatePopover date={date} onPick={onPick}>
      <DateBadge as="button" type="button" label={label} className={cn('cursor-pointer outline-none hover:bg-muted-foreground/15 focus-visible:ring-1 focus-visible:ring-ring', className)} {...props} />
    </DatePopover>
  )
}
