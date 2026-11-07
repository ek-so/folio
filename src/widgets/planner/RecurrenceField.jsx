import { useState } from 'react'
import { ArrowsClockwise, CalendarDot } from '@phosphor-icons/react'
import { cn, own } from '@/lib/utils'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { PLACEHOLDER } from '@/components/ui/placeholder.jsx'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover.jsx'
import { Segmented } from '@/components/ui/segmented.jsx'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.jsx'
import { DateField } from '@/components/DateBadge.jsx'
import { useSingleOpen } from '@/hooks/useSingleOpen.jsx'
import { formatDate } from '@/lib/dates.js'
import { keyDay, dayKey, addDays, todayKey, dateValue, DATE, REPEAT } from './planner.js'
import { parseRecurrence, formatRecurrence, ONE_TIME, UNITS, WEEKDAYS } from './recurrence.js'

const KINDS = [['one-time', 'One-time', CalendarDot], ['repeat', 'Repeats', ArrowsClockwise]]
const UNIT_NAMES = { day: 'Day', week: 'Week', month: 'Month', year: 'Year' }
const ENDS = [['never', 'Never'], ['on', 'On a day']]
const WEEK = [1, 2, 3, 4, 5, 6, 0] // Mon … Sun
// A planner's own badges (PropertyBadges `badges`), on its cards and on their notes' pages: its repeat
export const BADGES = { [REPEAT]: RecurrenceField }

// A rule to start from when Repeats is picked: weekly, on the card's own weekday
const WEEKLY = { kind: 'repeat', every: 1, unit: 'week', weekdays: [], until: null }

// A planner card's repeat (recurrence.js) as a badge: a calendar with a dot for one-time, circling arrows for a repeat (in the accent color),
// then its words ("Weekly on Mon, Wed"); no ▾. With `onChange(key, value)` it opens a popover: One-time or Repeats
// and, repeating, every how many days, weeks, months or years, the weekdays (weekly) and when it ends. Each choice is
// written at once (the number when it's left or on Enter). `props`: the card's properties, for its date (an end can't be before it).
export default function RecurrenceField({ prop, props, onChange }) {
  const [open, setOpen] = useSingleOpen()
  const value = Array.isArray(prop.value) ? prop.value[0] ?? '' : prop.value ?? ''
  const rule = parseRecurrence(value)
  const repeats = rule && rule.kind !== 'one-time'
  const label = value ? value.charAt(0).toUpperCase() + value.slice(1) : prop.key
  const Icon = repeats ? ArrowsClockwise : CalendarDot
  const badge = (
    <Badge
      as={onChange ? 'button' : 'span'} type={onChange ? 'button' : undefined}
      className={cn('max-w-full gap-1.5', repeats ? 'bg-primary/10 text-primary' : 'text-muted-foreground', onChange && 'cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring', onChange && (repeats ? 'hover:bg-primary/15' : 'hover:bg-muted-foreground/15'), !value && PLACEHOLDER)}
      {...(onChange ? own : {})}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Badge>
  )
  if (!onChange) return badge
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{badge}</PopoverTrigger>
      <PopoverContent {...own} data-badge-popover className="w-80" onCloseAutoFocus={e => e.preventDefault()}>
        <RecurrenceChooser rule={rule} start={cardDay(props)} onChange={next => onChange(prop.key, formatRecurrence(next))} />
      </PopoverContent>
    </Popover>
  )
}

// The card's day (a key) from its properties, or null
function cardDay(props = []) {
  const date = dateValue(props.find(p => p.key === DATE)?.value)
  return date && dayKey(date)
}

// The popover's choices for `rule` (null when the value isn't one: it counts as one-time until something is picked);
// `start`: the card's day: it can't end before it (it can end before today: it's archived when done next), and its first
// end is a year after it, or after today when that's later
function RecurrenceChooser({ rule, start, onChange }) {
  const earliest = start && start > todayKey() ? start : todayKey()
  const repeat = rule?.kind === 'repeat' ? rule : null
  const [typed, setTyped] = useState(null) // the number while it's typed
  const every = typed ?? String(repeat?.every ?? 1)
  const set = changes => onChange({ ...(repeat ?? WEEKLY), ...changes })
  const saveEvery = () => {
    const n = Math.floor(Number(typed))
    if (typed !== null && n >= 1 && n !== repeat?.every) set({ every: n })
    setTyped(null)
  }
  return (
    <div className="flex flex-col gap-space">
      <Segmented
        label="How often" options={KINDS}
        value={rule && rule.kind !== 'one-time' ? 'repeat' : 'one-time'}
        onChange={kind => onChange(kind === 'repeat' ? WEEKLY : { kind: ONE_TIME })}
      />
      {rule?.kind === 'unset' && <p className="text-sm text-muted-foreground">Pick how it repeats. Until then, Mark as done archives it like a one-time card.</p>}
      {rule && rule.kind !== 'one-time' && <>
        <div className="flex flex-col gap-space-xs">
          <Label htmlFor="recurrence-every" className="text-sm font-normal text-muted-foreground">Every</Label>
          <div className="flex items-center gap-space-sm">
            <Input
              id="recurrence-every" type="number" min={1} inputMode="numeric" value={every}
              onChange={e => setTyped(e.target.value)}
              onBlur={saveEvery}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveEvery() } }}
              className="w-16 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <Segmented label="Unit" value={repeat?.unit ?? 'week'} options={UNITS.map(u => [u, UNIT_NAMES[u]])} onChange={unit => set({ unit, weekdays: [] })} />
            </div>
          </div>
        </div>
        {(repeat?.unit ?? 'week') === 'week' && (
          <div className="flex flex-col gap-space-xs">
            <span className="text-sm text-muted-foreground">On</span>
            <ToggleGroup
              type="multiple" aria-label="Weekdays"
              value={(repeat?.weekdays ?? []).map(String)}
              onValueChange={days => set({ weekdays: days.map(Number) })}
              className="h-control gap-1 rounded-sm bg-segment p-1"
            >
              {WEEK.map(d => <ToggleGroupItem key={d} value={String(d)} variant="segmented" aria-label={WEEKDAYS[d]}>{WEEKDAYS[d].slice(0, 2)}</ToggleGroupItem>)}
            </ToggleGroup>
            {!repeat?.weekdays?.length && <p className="text-xs text-muted-foreground">None picked: the weekday of its date.</p>}
          </div>
        )}
        <div className="flex flex-col gap-space-xs">
          <span className="text-sm text-muted-foreground">Ends</span>
          <Segmented label="Ends" value={repeat?.until ? 'on' : 'never'} options={ENDS} onChange={end => set({ until: end === 'never' ? null : (repeat?.until ?? addDays(earliest, 365)) })} />
          {repeat?.until && (
            <DateField
              label={formatDate(keyDay(repeat.until))} date={keyDay(repeat.until)}
              onPick={d => d && set({ until: start && dayKey(d) < start ? start : dayKey(d) })} // never before the card's day
              className="self-start"
            />
          )}
        </div>
      </>}
    </div>
  )
}
