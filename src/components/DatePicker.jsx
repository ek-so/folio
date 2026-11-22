import { useState, useRef, cloneElement } from 'react'
import Later from './Later.jsx'
import { flushSync } from 'react-dom'
import { Plus, Trash } from '@phosphor-icons/react'
import BottomSheet, { SheetActions } from './BottomSheet.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Radio } from './ui/checkbox.jsx'
import { later } from '@/lib/later.js'
import { REMINDERS } from '@/lib/reminders.js'
import { askToNotify } from '../hooks/useReminderAlerts.js'
import { Switch } from './ui/switch.jsx'
import { Input } from './ui/input.jsx'
import { Label } from './ui/label.jsx'
import { Button } from './ui/button.jsx'
import { Separator } from './ui/separator.jsx'

const Calendar = later(() => import('./ui/calendar.jsx'), m => m.Calendar) // its date library stays out of the first screen

const pad = n => String(n).padStart(2, '0')

// The one date picker, in a sheet (a centered dialog on a computer) opened by `children` (its trigger: a date badge, a
// button), titled `title` ('Date'): whatever is written (a day, a time, both, or nothing), the Calendar, then Remove
// date when there's a day, then the time: + Add time when there's none, else its field with a trash (Remove time),
// then, with `reminder` ({ value: its offset, '' for none, onChange(next) }: a date property's, lib/reminders.js), its
// Reminder (only once there's a day: a time alone or nothing never reminds; "Pick a day to add a reminder" until then):
// a switch, off while there's none; on (it asks the browser to let Folio notify) it starts At the time and
// shows when: At the time, 10 minutes, 1 hour or 1 day before, one of them chosen. `date`: { year, month, day, hour?, minute? }, { hour,
// minute } (a time alone) or null (an empty date property); `onPick(date)` gets the new one: a picked day keeps the time;
// a time, saved on Enter or when the field is left, keeps the day; taking out the day (Remove date, or the selected day
// tapped again) keeps the time, and taking out the last of the two gives null. Each change is saved at once and the
// sheet stays open for the next; Save (on the right, last) saves a time still being typed and closes it, as ✕ does, but for `dayOnly`: a day and nothing else (going to a day, a repeat's
// end, a new task's day): no time or reminder, it can't be emptied, and picking a day closes it. `required`: it can't
// be emptied (a date in a note's text: the last part has no Remove). (Saving rewrites the note, which draws its badges
// anew, so a time isn't saved on every keystroke.)
export default function DatePicker({ date, onPick, required, dayOnly, reminder, title = 'Date', children }) {
  const [open, setOpenState] = useState(false)
  const hasDay = date?.year !== undefined
  const selected = hasDay ? new Date(date.year, date.month - 1, date.day) : undefined
  const saved = date?.hour === undefined ? '' : `${pad(date.hour)}:${pad(date.minute)}`
  const [typed, setTyped] = useState(null) // the time field's text while it differs from the saved one
  const [adding, setAdding] = useState(false) // + Add time was tapped: the field shows, empty, until a time is saved
  const timeRef = useRef()
  const time = typed ?? saved
  const setOpen = next => { if (!next) { setTyped(null); setAdding(false) }; setOpenState(next) }
  const close = () => { saveTime(); setOpen(false) } // ✕ and Save: a time still being typed is kept

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
  }
  function addTime() {
    flushSync(() => setAdding(true))
    timeRef.current?.focus()
  }

  const showsTime = !dayOnly && (saved || adding)
  // The trigger opens the sheet (its own click handler, a badge's that keeps the click from the note, still runs)
  const trigger = cloneElement(children, { onClick: e => { children.props.onClick?.(e); setOpen(true) } })
  return <>
    {trigger}
    {open && (
      <BottomSheet title={title} onClose={close} onOpenAutoFocus={e => e.preventDefault()}>
        <div data-badge-popover className="-mx-space-xs flex flex-col">
          <div className="px-space-xs">
            <Later compact>
              <Calendar
                fill
                mode="single"
                selected={selected}
                defaultMonth={selected}
                onSelect={d => {
                  if (d) pick(at({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }))
                  else if (time || keeps) pick(time ? clock(time) : null) // the selected day tapped again: taken out
                  if (dayOnly) setOpen(false)
                }}
              />
            </Later>
          </div>
          {hasDay && (time || keeps) && (
            <Button variant="ghost-destructive" className="w-full justify-start gap-space-sm px-3" onClick={removeDay}><Trash /> Remove date</Button>
          )}
          {!dayOnly && <>
            <Separator className="my-space-sm" />
            {showsTime ? (
              <div className="flex items-center gap-space-sm px-space-xs">
                <Label htmlFor="date-picker-time" className="font-normal leading-5 text-muted-foreground">Time</Label>
                <Input
                  ref={timeRef} id="date-picker-time" type="time" value={time}
                  onChange={e => setTyped(e.target.value)}
                  onBlur={saveTime}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveTime() } }}
                  className="flex-1 appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                />
                {(hasDay || keeps) && (
                  <Button variant="ghost-destructive" size="icon" aria-label="Remove time" tooltip="Remove time" className="shrink-0" onMouseDown={e => e.preventDefault()} onClick={removeTime}><Trash /></Button>
                )}
              </div>
            ) : (
              <Button variant="ghost" className="w-full justify-start gap-space-sm px-3" onClick={addTime}><Plus /> Add time</Button>
            )}
          </>}
          {!dayOnly && reminder && !hasDay && <>
            <Separator className="my-space-sm" />
            <p className="px-3 text-sm text-muted-foreground">Pick a day to add a reminder.</p>
          </>}
          {!dayOnly && reminder && hasDay && <>
            <Separator className="my-space-sm" />
            <div className="flex min-h-control items-center gap-space-sm px-3">
              <Label htmlFor="date-picker-reminder" className="flex-1 font-normal">Reminder</Label>
              <Switch
                id="date-picker-reminder" checked={Boolean(reminder.value)}
                onCheckedChange={on => { if (on) askToNotify(); reminder.onChange(on ? REMINDERS[1][0] : '') }}
              />
            </div>
            {reminder.value && (
              <ul role="radiogroup" aria-label="When to remind">
                {REMINDERS.filter(([value]) => value).map(([value, label]) => (
                  <li key={value}>
                    <ListRow icon={<Radio checked={reminder.value === value} />} title={label} onClick={() => reminder.onChange(value)} />
                  </li>
                ))}
              </ul>
            )}
          </>}
          {!dayOnly && (
            <SheetActions className="px-space-xs">
              <Button onMouseDown={e => e.preventDefault()} onClick={close}>Save</Button>
            </SheetActions>
          )}
        </div>
      </BottomSheet>
    )}
  </>
}
