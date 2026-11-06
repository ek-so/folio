import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import { Calendar } from './ui/calendar.jsx'
import { useSingleOpen } from '../hooks/useSingleOpen.jsx'
import { own } from '../lib/utils.js'

// A day to pick in a calendar (shadcn's Calendar) in a popover opened by `children` (its trigger: a date badge).
// `date`: { year, month, day } or null; `onPick(day)`: the picked { year, month, day }, or null when the
// selected day is tapped again. One popover open at a time, like the badges' (useSingleOpen).
export default function DatePopover({ date, onPick, children }) {
  const [open, setOpen] = useSingleOpen()
  const selected = date ? new Date(date.year, date.month - 1, date.day) : undefined
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent {...own} data-badge-popover className="w-auto p-0" onCloseAutoFocus={e => e.preventDefault()}>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={d => { onPick(d ? { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } : null); setOpen(false) }}
        />
      </PopoverContent>
    </Popover>
  )
}
