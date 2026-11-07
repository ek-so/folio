import { useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Plus, X } from '@phosphor-icons/react'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import { Calendar } from './ui/calendar.jsx'
import { Input } from './ui/input.jsx'
import { Label } from './ui/label.jsx'
import { Button } from './ui/button.jsx'
import { Separator } from './ui/separator.jsx'
import { useSingleOpen } from '../hooks/useSingleOpen.jsx'
import { own } from '../lib/utils.js'

const pad = n => String(n).padStart(2, '0')

// The one date picker, in a popover opened by `children` (its trigger: a date badge), as shadcn's date picker with
// time: whatever is written (a day, a time, both, or nothing), the Calendar, then Remove date when there's a day, then
// the time: + Add time when there's none, else its field with ✕ (Remove time). `date`: { year, month, day, hour?,
// minute? }, { hour, minute } (a time alone) or null (an empty date property); `onPick(date)` gets the new one: a
// picked day keeps the time (and closes the popover); a time, saved on Enter, when the field is left or with a picked
// day, keeps the day; taking out the day (Remove date, or the selected day tapped again) keeps the time, and taking out
// the last of the two gives null. `required`: it can't be emptied (a date in a note's text: the last part has no
// Remove). `dayOnly`: a day and nothing else (going to a day, a repeat's end): no time, and it can't be emptied.
// (Saving rewrites the note, which draws its badges anew, so a time isn't saved on every keystroke.)
// One popover open at a time (useSingleOpen).
export default function DatePopover({ date, onPick, required, dayOnly, children }) {
  const [open, setOpenState] = useSingleOpen()
  const hasDay = date?.year !== undefined
  const selected = hasDay ? new Date(date.year, date.month - 1, date.day) : undefined
  const saved = date?.hour === undefined ? '' : `${pad(date.hour)}:${pad(date.minute)}`
  const [typed, setTyped] = useState(null) // the time field's text while it differs from the saved one
  const [adding, setAdding] = useState(false) // + Add time was tapped: the field shows, empty, until a time is saved
  const timeRef = useRef()
  const time = typed ?? saved
  const setOpen = next => { if (!next) { setTyped(null); setAdding(false) }; setOpenState(next) }
  const day = date && hasDay ? { year: date.year, month: date.month, day: date.day } : {}
  const clock = value => { const [hour, minute] = value.split(':').map(Number); return { hour, minute } }
  // `parts` ({ year, month, day } or {}) at the time in the field, if any; null when nothing is left
  const at = parts => time ? { ...parts, ...clock(time) } : parts.year !== undefined ? parts : null
  const keeps = !(required || dayOnly) // the last part can be taken out
  const pick = next => { if (next || keeps) onPick(next) }

  function saveTime() {
    if (typed !== null && typed !== saved && typed) pick({ ...day, ...clock(typed) })
    setTyped(null)
  }
  function removeTime() {
    setTyped(null)
    setAdding(false)
    if (saved) pick(hasDay ? day : null) // a time only being added has nothing to take out
  }
  function removeDay() {
    pick(time ? clock(time) : null)
    setOpen(false)
  }
  function addTime() {
    flushSync(() => setAdding(true))
    timeRef.current?.focus()
  }

  const showsTime = !dayOnly && (saved || adding)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent {...own} data-badge-popover className="flex w-auto flex-col p-0" onCloseAutoFocus={e => e.preventDefault()}>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={d => {
            if (d) pick(at({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }))
            else if (time || keeps) pick(time ? clock(time) : null) // the selected day tapped again: taken out
            setOpen(false)
          }}
        />
        {hasDay && (time || keeps) && (
          <div className="px-space-sm pb-space-sm">
            <Button variant="ghost-destructive" className="w-full justify-start gap-2 px-3" onClick={removeDay}><X /> Remove date</Button>
          </div>
        )}
        {!dayOnly && <>
          <Separator />
          {showsTime ? (
            <div className="flex items-center gap-space-sm p-space-sm">
              <Label htmlFor="date-popover-time" className="font-normal leading-5 text-muted-foreground">Time</Label>
              <Input
                ref={timeRef} id="date-popover-time" type="time" value={time}
                onChange={e => setTyped(e.target.value)}
                onBlur={saveTime}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveTime(); setOpen(false) } }}
                className="flex-1 appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
              />
              {(hasDay || keeps) && (
                <Button variant="ghost-destructive" size="icon" aria-label="Remove time" tooltip="Remove time" className="shrink-0" onMouseDown={e => e.preventDefault()} onClick={removeTime}><X /></Button>
              )}
            </div>
          ) : (
            <div className="p-space-sm">
              <Button variant="ghost" className="w-full justify-start gap-2 px-3" onClick={addTime}><Plus /> Add time</Button>
            </div>
          )}
        </>}
      </PopoverContent>
    </Popover>
  )
}
