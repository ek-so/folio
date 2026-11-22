import { forwardRef } from 'react'
import { CalendarBlank, Clock, BellSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Badge } from './ui/badge.jsx'
import DatePicker from './DatePicker.jsx'

// A date (lib/dates.js) as a grey badge (or in Badge's `tone`: a late one red), its calendar icon (a clock for a time alone) grey too, then the date as "17 Oct 2026, 14:30" (its spot,
// a <time>, holds the machine-readable date). In a line of text (`inline`) it's small, so the line keeps its
// height; as a property it's the size of the other property badges. Other props go on the badge (the preview's
// tap handler: a portal's clicks don't reach the preview on their own)
// A time alone ("14:30", formatDate's) gets a clock instead of the calendar. `reminded`: a bell after the date (its
// reminder is set)
const TIME_ONLY = /^\d{2}:\d{2}$/

const DateBadge = forwardRef(function DateBadge({ label, inline, reminded, rang, className, ...props }, ref) {
  return (
    <Badge ref={ref} {...props} className={cn('whitespace-nowrap', !props.tone && 'text-muted-foreground', inline ? 'h-5 gap-space-xs px-1.5 py-0 align-[-0.15em] text-xs' : 'gap-1.5', className)}>
      {TIME_ONLY.test(label) ? <Clock className={cn('shrink-0', inline ? 'size-3.5' : 'size-4')} /> : <CalendarBlank className={cn('shrink-0', inline ? 'size-3.5' : 'size-4')} />}
      {label}
      {reminded && (
        <span className="relative flex shrink-0">
          <BellSimple aria-label={rang ? 'Reminder came due' : 'Reminder set'} className={inline ? 'size-3.5' : 'size-4'} />
          {rang && <span aria-hidden className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-destructive ring-1 ring-card" />}
        </span>
      )}
    </Badge>
  )
})
export default DateBadge

// A date badge (`inline`: in a line of text) that, with `onPick(date)` (DatePicker's), opens the date picker to change
// its day and time, add either or take either out; one in a line of text can't be emptied (`required`: its last part
// stays). `dayOnly`: DatePicker's (a day and nothing else). `reminder` ({ value: its offset, onChange(next) }): a date property's, chosen in
// the picker and shown as a bell; `rang`: it came due and is still in Notifications, a dot on the bell. Without `onPick`, plain
export function DateField({ label, date, onPick, dayOnly, reminder, rang, className, ...props }) {
  if (!onPick) return <DateBadge label={label} reminded={Boolean(reminder?.value)} rang={rang} className={className} {...props} />
  return (
    <DatePicker date={date} onPick={onPick} required={props.inline} dayOnly={dayOnly} reminder={reminder}>
      <DateBadge as="button" type="button" label={label} reminded={Boolean(reminder?.value)} rang={rang} hoverable className={cn('cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring', className)} {...props} />
    </DatePicker>
  )
}
