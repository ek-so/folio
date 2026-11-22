import { useState, cloneElement } from 'react'
import Later from './Later.jsx'
import { Trash, Plus } from '@phosphor-icons/react'
import BottomSheet, { SheetActions } from './BottomSheet.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Radio } from './ui/checkbox.jsx'
import { later } from '@/lib/later.js'
import { REMINDERS } from '@/lib/reminders.js'
import { askToNotify } from '../hooks/useReminderAlerts.js'
import { SectionTitle } from './ui/section-title.jsx'
import { Input } from './ui/input.jsx'
import { Button } from './ui/button.jsx'

const Calendar = later(() => import('./ui/calendar.jsx'), m => m.Calendar) // its date library stays out of the first screen

const pad = n => String(n).padStart(2, '0')

// The one date picker, in a sheet (a centered dialog on a computer) opened by `children` (its trigger: a date badge, a
// button), titled Date and time (Date for `dayOnly`): whatever is written (a day, a time, both, or nothing), in sections
// under their titles (`SectionTitle`, like Views in the menu), each with a trash on the right of its title while it's
// set (Remove date, Remove time, Remove reminder), 16px apart with no line between. A section with nothing set shows
// "+ Add date", "+ Add time" or "+ Add reminder" under its title, which sets today, the time now or At the time (the
// rest kept); its trash brings the button back. Date: the Calendar in an outlined
// box (just that box for `dayOnly`); Time, its field (empty while there's none), and, with
// `reminder` ({ value: its offset, '' for none, onChange(next) }: a date property's, lib/reminders.js), Reminder (only
// once there's a day: a time alone or nothing never reminds; "Pick a day to add a reminder" until then): when, At the
// time, 10 minutes, 1 hour or 1 day before, none chosen while there's none (choosing the first asks the browser to let
// Folio notify). `date`: { year, month, day, hour?, minute? }, { hour, minute } (a time alone) or null (an empty date
// property). Changes are a draft (`draft`: the date and the reminder) until Save (on the right, last), which gives
// `onPick(date)` the new date, when it changed, and the reminder its new offset (a time still being typed is kept);
// ✕ (or closing the sheet) drops the draft. In it, a picked day keeps the time; a time, set on Enter or when the field
// is left, keeps the day; taking out the day (Remove date, or the selected day tapped again) keeps the time and takes the
// reminder out (it needs a day), and taking out the last of the two leaves nothing (null once saved). `dayOnly`: a day
// and nothing else (going to a day, a repeat's end, a new task's day): no time or reminder, it can't be emptied, and
// picking a day gives it to `onPick` at once and closes it. `required`: it can't be emptied (a date in a note's text:
// the last part has no Remove).
export default function DatePicker({ date: value, onPick, required, dayOnly, reminder, children }) {
  const [open, setOpenState] = useState(false)
  const [draft, setDraft] = useState(null) // { date, reminder } while the sheet is open (not for `dayOnly`)
  const date = draft ? draft.date : value
  const reminderValue = draft ? draft.reminder : reminder?.value
  const hasDay = date?.year !== undefined
  const selected = hasDay ? new Date(date.year, date.month - 1, date.day) : undefined
  const saved = date?.hour === undefined ? '' : `${pad(date.hour)}:${pad(date.minute)}`
  const [typed, setTyped] = useState(null) // the time field's text while it differs from the saved one
  const time = typed ?? saved
  const setOpen = next => {
    setTyped(null)
    setDraft(next && !dayOnly ? { date: value, reminder: reminder?.value ?? '' } : null)
    setOpenState(next)
  }

  const day = date && hasDay ? { year: date.year, month: date.month, day: date.day } : {}
  const clock = value => { const [hour, minute] = value.split(':').map(Number); return { hour, minute } }
  // `parts` ({ year, month, day } or {}) at the time in the field, if any; null when nothing is left
  const at = parts => time ? { ...parts, ...clock(time) } : parts.year !== undefined ? parts : null
  const keeps = !(required || dayOnly) // the last part can be taken out
  // `next` as the draft's date (a reminder goes without a day); `dayOnly`: given to onPick at once
  const pick = next => {
    if (!next && !keeps) return
    if (dayOnly) return onPick(next)
    setDraft(d => ({ date: next, reminder: next?.year === undefined ? '' : d.reminder }))
  }

  // The time being typed, when it differs from the draft's: the draft's date with it
  const typedDate = () => typed !== null && typed !== saved && typed ? { ...day, ...clock(typed) } : null
  function saveTime() {
    const next = typedDate()
    if (next) pick(next)
    setTyped(null)
  }

  // Save: the draft (with a time still being typed) into the note: the date when it changed, then the reminder when it
  // did (taken out with the date by onPick when nothing's left)
  function save() {
    const next = typedDate() ?? draft.date
    const remindAt = next?.year === undefined ? '' : draft.reminder
    if (JSON.stringify(next) !== JSON.stringify(value) && (next || keeps)) onPick(next)
    if (reminder && next && remindAt !== (reminder.value ?? '')) reminder.onChange(remindAt)
    setOpen(false)
  }
  function removeTime() {
    setTyped(null)
    pick(hasDay ? day : null)
  }
  function removeDay() {
    pick(time ? clock(time) : null)
  }
  // + Add date: today, at the time already set; + Add time: the time now, on the day already set
  function addDay() {
    const now = new Date()
    pick(at({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }))
  }
  function addTime() {
    const now = new Date()
    setTyped(null)
    pick({ ...day, hour: now.getHours(), minute: now.getMinutes() })
  }
  function remind(offset) {
    if (!reminderValue) askToNotify()
    setDraft(d => ({ ...d, reminder: offset }))
  }
  // A section's trash, on the right of its title
  const trash = (label, onClick) => (
    <Button variant="ghost-destructive" size="icon-md" aria-label={label} tooltip={label} onMouseDown={e => e.preventDefault()} onClick={onClick}><Trash /></Button>
  )

  // An empty section's button, under its title; it keeps the focus where it is, like the trashes (iOS would only close the
  // keyboard on the first tap)
  const addButton = (label, onClick) => (
    <div className="px-space-xs">
      <Button variant="secondary" onMouseDown={e => e.preventDefault()} onClick={onClick}><Plus /> {label}</Button>
    </div>
  )
  // What each section shows: its content while it's set, else its + Add button. A date that can't be emptied
  // (`required`) always shows its calendar, and a time being typed its field
  const showDay = dayOnly || hasDay || !keeps
  const showTime = saved || typed !== null

  // The trigger opens the sheet (its own click handler, a badge's that keeps the click from the note, still runs)
  const trigger = cloneElement(children, { onClick: e => { children.props.onClick?.(e); setOpen(true) } })
  return <>
    {trigger}
    {open && (
      <BottomSheet title={dayOnly ? 'Date' : 'Date and time'} onClose={() => setOpen(false)} onOpenAutoFocus={e => e.preventDefault()}>
        <div data-badge-popover className="-mx-space-xs flex flex-col">
          {!dayOnly && <SectionTitle trailing={hasDay && (time || keeps) && trash('Remove date', removeDay)}>Date</SectionTitle>}
          {/* The Calendar in an outlined box of its own */}
          {showDay ? <div className="mx-space-xs rounded-lg border border-border p-space-sm">
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
          </div> : addButton('Add date', addDay)}
          {!dayOnly && <>
            <SectionTitle className="mt-space" trailing={saved && (hasDay || keeps) && trash('Remove time', removeTime)}>Time</SectionTitle>
            {showTime ? <div className="px-space-xs">
              <Input
                type="time" aria-label="Time" value={time}
                onChange={e => setTyped(e.target.value)}
                onBlur={saveTime}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveTime() } }}
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div> : addButton('Add time', addTime)}
          </>}
          {!dayOnly && reminder && <>
            <SectionTitle className="mt-space" trailing={reminderValue && trash('Remove reminder', () => remind(''))}>Reminder</SectionTitle>
            {hasDay && !reminderValue ? addButton('Add reminder', () => remind(REMINDERS[0][0])) : hasDay ? (
              <ul role="radiogroup" aria-label="When to remind">
                {REMINDERS.map(([value, label]) => (
                  <li key={value}>
                    <ListRow icon={<Radio checked={reminderValue === value} />} title={label} onClick={() => remind(value)} />
                  </li>
                ))}
              </ul>
            ) : <p className="px-3 text-sm text-muted-foreground">Pick a day to add a reminder.</p>}
          </>}
        </div>
        {/* Out of the box above, which reaches 4px into the sides: the buttons' separator spans the sheet exactly */}
        {!dayOnly && (
          <SheetActions>
            <Button onMouseDown={e => e.preventDefault()} onClick={save}>Save</Button>
          </SheetActions>
        )}
      </BottomSheet>
    )}
  </>
}
