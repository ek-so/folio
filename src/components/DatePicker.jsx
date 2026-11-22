import { useState, cloneElement } from 'react'
import Later from './Later.jsx'
import { Trash } from '@phosphor-icons/react'
import BottomSheet, { SheetActions } from './BottomSheet.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Radio } from './ui/checkbox.jsx'
import { later } from '@/lib/later.js'
import { REMINDERS } from '@/lib/reminders.js'
import { askToNotify } from '../hooks/useReminderAlerts.js'
import { SectionTitle } from './ui/section-title.jsx'
import { Input } from './ui/input.jsx'
import { Button } from './ui/button.jsx'
import { Separator } from './ui/separator.jsx'

const Calendar = later(() => import('./ui/calendar.jsx'), m => m.Calendar) // its date library stays out of the first screen

const pad = n => String(n).padStart(2, '0')

// The one date picker, in a sheet (a centered dialog on a computer) opened by `children` (its trigger: a date badge, a
// button), titled Date and time (Date for `dayOnly`): whatever is written (a day, a time, both, or nothing), in sections
// under their titles (`SectionTitle`, like Views in the menu), each with a trash on the right of its title while it's
// set (Remove date, Remove time, Remove reminder): Date, the Calendar (just the Calendar for `dayOnly`); Time, its field (empty while there's none), and, with
// `reminder` ({ value: its offset, '' for none, onChange(next) }: a date property's, lib/reminders.js), Reminder (only
// once there's a day: a time alone or nothing never reminds; "Pick a day to add a reminder" until then): when, At the
// time, 10 minutes, 1 hour or 1 day before, none chosen while there's none (choosing the first asks the browser to let
// Folio notify). `date`: { year, month, day, hour?, minute? }, { hour, minute } (a time alone) or null (an empty date
// property); `onPick(date)` gets the new one: a picked day keeps the time; a time, saved on Enter or when the field is
// left, keeps the day; taking out the day (Remove date, or the selected day tapped again) keeps the time, and taking out
// the last of the two gives null. Each change is saved at once and the sheet stays open for the next; Save (on the
// right, last) saves a time still being typed and closes it, as ✕ does, but for `dayOnly`: a day and nothing else
// (going to a day, a repeat's end, a new task's day): no time or reminder, it can't be emptied, and picking a day closes
// it. `required`: it can't be emptied (a date in a note's text: the last part has no Remove). (Saving rewrites the note,
// which draws its badges anew, so a time isn't saved on every keystroke.)
export default function DatePicker({ date, onPick, required, dayOnly, reminder, children }) {
  const [open, setOpenState] = useState(false)
  const hasDay = date?.year !== undefined
  const selected = hasDay ? new Date(date.year, date.month - 1, date.day) : undefined
  const saved = date?.hour === undefined ? '' : `${pad(date.hour)}:${pad(date.minute)}`
  const [typed, setTyped] = useState(null) // the time field's text while it differs from the saved one
  const time = typed ?? saved
  const setOpen = next => { if (!next) setTyped(null); setOpenState(next) }
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
    pick(hasDay ? day : null)
  }
  function removeDay() {
    pick(time ? clock(time) : null)
  }
  function remind(offset) {
    if (!reminder.value) askToNotify()
    reminder.onChange(offset)
  }
  // A section's trash, on the right of its title
  const trash = (label, onClick) => (
    <Button variant="ghost-destructive" size="icon-md" aria-label={label} tooltip={label} onMouseDown={e => e.preventDefault()} onClick={onClick}><Trash /></Button>
  )

  // The trigger opens the sheet (its own click handler, a badge's that keeps the click from the note, still runs)
  const trigger = cloneElement(children, { onClick: e => { children.props.onClick?.(e); setOpen(true) } })
  return <>
    {trigger}
    {open && (
      <BottomSheet title={dayOnly ? 'Date' : 'Date and time'} onClose={close} onOpenAutoFocus={e => e.preventDefault()}>
        <div data-badge-popover className="-mx-space-xs flex flex-col">
          {!dayOnly && <SectionTitle trailing={hasDay && (time || keeps) && trash('Remove date', removeDay)}>Date</SectionTitle>}
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
          {!dayOnly && <>
            <Separator className="mt-space mb-space-sm" />
            <SectionTitle trailing={saved && (hasDay || keeps) && trash('Remove time', removeTime)}>Time</SectionTitle>
            <div className="px-space-xs">
              <Input
                type="time" aria-label="Time" value={time}
                onChange={e => setTyped(e.target.value)}
                onBlur={saveTime}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveTime() } }}
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
          </>}
          {!dayOnly && reminder && <>
            <Separator className="mt-space mb-space-sm" />
            <SectionTitle trailing={reminder.value && trash('Remove reminder', () => reminder.onChange(''))}>Reminder</SectionTitle>
            {hasDay ? (
              <ul role="radiogroup" aria-label="When to remind">
                {REMINDERS.map(([value, label]) => (
                  <li key={value}>
                    <ListRow icon={<Radio checked={reminder.value === value} />} title={label} onClick={() => remind(value)} />
                  </li>
                ))}
              </ul>
            ) : <p className="px-3 text-sm text-muted-foreground">Pick a day to add a reminder.</p>}
          </>}
        </div>
        {/* Out of the box above, which reaches 4px into the sides: the buttons' separator spans the sheet exactly */}
        {!dayOnly && (
          <SheetActions>
            <Button onMouseDown={e => e.preventDefault()} onClick={close}>Save</Button>
          </SheetActions>
        )}
      </BottomSheet>
    )}
  </>
}
