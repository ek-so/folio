import { useState } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import { Calendar } from './ui/calendar.jsx'
import { Input } from './ui/input.jsx'
import { useSingleOpen } from '../hooks/useSingleOpen.jsx'
import { own } from '../lib/utils.js'

const pad = n => String(n).padStart(2, '0')

// A date to pick in a popover opened by `children` (its trigger: a date badge), as shadcn's date picker with time:
// its Calendar, then, for a date written with a time, a time field (a date alone gets the calendar alone). `date`: { year, month, day, hour?, minute? } or null; `onPick(date)` gets the
// new one: a picked day keeps the time (and closes the popover); a time, saved on Enter, when the field is left or
// with a picked day, keeps the day, and an emptied one takes it out; null when the selected day is tapped again.
// (Saving rewrites the note, which draws its badges anew, so a time isn't saved on every keystroke.)
// One popover open at a time (useSingleOpen).
export default function DatePopover({ date, onPick, children }) {
  const [open, setOpen] = useSingleOpen()
  const selected = date ? new Date(date.year, date.month - 1, date.day) : undefined
  const saved = date?.hour === undefined ? '' : `${pad(date.hour)}:${pad(date.minute)}`
  const [typed, setTyped] = useState(null) // the time field's text while it differs from the saved one
  const time = typed ?? saved
  // `day` ({ year, month, day }) at the time in the field, if any
  const at = day => {
    const [hour, minute] = time.split(':').map(Number)
    return time ? { ...day, hour, minute } : day
  }
  const day = ({ year, month, day }) => ({ year, month, day })
  const saveTime = () => { if (typed !== null && typed !== saved) onPick(at(day(date))); setTyped(null) }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent {...own} data-badge-popover className="w-auto p-0" onCloseAutoFocus={e => e.preventDefault()}>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          // Today is marked lightly: the theme's accent is its primary blue, the selected day's
          classNames={{ today: 'rounded-md bg-secondary text-foreground data-[selected=true]:rounded-none' }}
          onSelect={d => {
            onPick(d ? at({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }) : null)
            setTyped(null)
            setOpen(false)
          }}
        />
        {date?.hour !== undefined && (
          <div className="flex items-center gap-space-sm border-t border-border p-3">
            <label htmlFor="date-popover-time" className="text-sm text-muted-foreground">Time</label>
            <Input
              id="date-popover-time" type="time" value={time}
              onChange={e => setTyped(e.target.value)}
              onBlur={saveTime}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveTime(); setOpen(false) } }}
              className="flex-1 appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
