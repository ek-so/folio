import { forwardRef } from 'react'
import { CalendarBlank, Clock } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Badge } from './ui/badge.jsx'
import DatePopover from './DatePopover.jsx'

// A date (lib/dates.js) as a grey badge, its calendar icon (a clock for a time alone) grey too, then the date as "17 Oct 2026, 14:30" (its spot,
// a <time>, holds the machine-readable date). In a line of text (`inline`) it's small, so the line keeps its
// height; as a property it's the size of the other property badges. Other props go on the badge (the preview's
// tap handler: a portal's clicks don't reach the preview on their own)
// A time alone ("14:30", formatDate's) gets a clock instead of the calendar
const TIME_ONLY = /^\d{2}:\d{2}$/

const DateBadge = forwardRef(function DateBadge({ label, inline, className, ...props }, ref) {
  return (
    <Badge ref={ref} {...props} className={cn('whitespace-nowrap text-muted-foreground', inline ? 'h-5 gap-1 px-1.5 py-0 align-[-0.15em] text-xs' : 'gap-1.5', className)}>
      {TIME_ONLY.test(label) ? <Clock className={cn('shrink-0', inline ? 'size-3.5' : 'size-4')} /> : <CalendarBlank className={cn('shrink-0', inline ? 'size-3.5' : 'size-4')} />}
      {label}
    </Badge>
  )
})
export default DateBadge

// A date badge (`inline`: in a line of text) that, with `onPick(date)` (DatePopover's), opens a calendar and a time
// field to change it; without, plain
export function DateField({ label, date, onPick, className, ...props }) {
  if (!onPick) return <DateBadge label={label} className={className} {...props} />
  return (
    <DatePopover date={date} onPick={onPick}>
      <DateBadge as="button" type="button" label={label} className={cn('cursor-pointer outline-none hover:bg-muted-foreground/15 focus-visible:ring-1 focus-visible:ring-ring', className)} {...props} />
    </DatePopover>
  )
}
