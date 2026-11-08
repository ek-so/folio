import { toast } from 'sonner'
import { Fragment, useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react'
import { Tag, Plus, CalendarBlank, CrosshairSimple, CalendarDots, ListBullets, ArrowsClockwise } from '@phosphor-icons/react'
import { DndContext, DragOverlay, useDraggable, useDroppable, pointerWithin } from '@dnd-kit/core'
import { useDragSensors } from '@/hooks/useDragSensors.js'
import { cn } from '@/lib/utils.js'
import { Button } from '@/components/ui/button.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Segmented } from '@/components/ui/segmented.jsx'
import { ListRow } from '@/components/ui/list-row.jsx'
import { Tray, TrayTitle, TrayFooter, TRAY_BUTTON, TRAY_ROW } from '@/components/ui/tray.jsx'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu.jsx'
import NoteCard, { NO_CALLOUT, ownListeners, cardClick } from '@/components/NoteCard.jsx'
import WidgetFrame from '@/components/WidgetFrame.jsx'
import CardMenu, { cardActions } from '@/components/CardMenu.jsx'
import PropertiesDialog from '@/components/PropertiesDialog.jsx'
import DatePopover from '@/components/DatePopover.jsx'
import { shownCards, hiddenCards, shownLimit } from '@/lib/trayCards.js'
import { useGridColumns } from '@/hooks/useGridColumns.js'
import { cardTitle } from '@/lib/folderNotes.js'
import { formatDate, dateLabel } from '@/lib/dates.js'
import { properties } from '@/lib/frontmatter.js'
import { DATE, REPEAT, FIXED, listed, plan, addDays, daysBetween, dayOffsets, dayAt, keyDay, dayKey, cardDate, dateValue, droppedDate, monthLabel } from './planner.js'
import { usePlanner } from './usePlanner.js'
import { useToday } from './useToday.js'
import { BADGES } from './RecurrenceField.jsx'
import { WEEKDAYS, parseRecurrence, repeatLabel } from './recurrence.js'
import { plural } from '@/lib/plural.js'

// The ribbon: each day takes DAY_WIDTH (its box and the gap around it), and a line between months MONTH_GAP (a box that
// wide with the 1px line in its middle: the days' gap on each side), so the scrolling sums match what's drawn; it starts
// with a window of days around a day (today, or one picked far away) and grows by MORE_DAYS on either side as it's
// scrolled near an end (EDGE), so it never ends
const DAY_WIDTH = 80
const MONTH_GAP = 9
const MORE_DAYS = 60
const EDGE = DAY_WIDTH * 3

const dayCardId = path => 'card:' + path
const dayCellId = key => 'day:' + key

// Only a day under the pointer is a target: a card let go anywhere else is cancelled, never re-dated
const collide = pointerWithin

// A planner widget (planner.js): its folder's name and ⋯ on top, a ribbon of days that scrolls
// sideways (the month on top, today marked, the selected day filled, how many cards each day has),
// and under it the cards of the selected day. A card is dragged onto a day to change its date; its
// date badge opens a calendar. Cards without a date always show under today, and cards dated before
// today also, with a dashed outline. Everything it does is in usePlanner; `services` come from the app (widgets/index.js).
export default function Planner({ id, services, onRemove }) {
  const { ready, planner, missing, cards, ...act } = usePlanner(id, services)
  const { notes, canEdit, openFile, openFolder } = services
  const files = useMemo(() => Object.fromEntries(services.files.map(f => [f, true])), [services.files]) // as the preview's links want them
  const today = useToday()
  const [picked, setPicked] = useState(null) // the day chosen on the ribbon; none follows today
  const selected = picked ?? today
  const [anchor, setAnchor] = useState(today) // the ribbon's days are counted from where it started, so a new day doesn't shift them
  const [expanded, setExpanded] = useState(() => new Set()) // keys of the days showing all their cards (`list:` and a group's key: a list group)
  const [range, setRange] = useState({ before: MORE_DAYS, after: MORE_DAYS * 2 }) // days shown before and after today
  const [dragged, setDragged] = useState(null) // the path of the card being dragged
  const [grid, setGrid] = useState(null) // the selected day's grid of cards, whose columns are counted
  const limit = shownLimit(useGridColumns(grid)) // its cards shown before Show more: whole rows on desktop
  const [choosing, setChoosing] = useState(false) // the Properties sheet
  const { view, setView: pickView } = act // calendar or list, this device's choice
  const [jumping, setJumping] = useState(null) // a day picked in the calendar, scrolled to once the ribbon has it
  const [month, setMonth] = useState(() => monthLabel(today)) // the month of the day in the middle of the ribbon, its title
  const scroller = useRef(null)
  const grown = useRef(false) // days were added before the first: the view moves by their width to keep its place
  const centered = useRef(false)
  const off = !canEdit || !planner || missing
  const sensors = useDragSensors()

  const days = useMemo(() => Array.from({ length: range.before + range.after + 1 }, (_, i) => addDays(anchor, i - range.before)), [anchor, range])
  const offsets = useMemo(() => dayOffsets(days, DAY_WIDTH, MONTH_GAP), [days])
  const arranged = useMemo(() => plan(cards, today), [cards, today])
  const groups = useMemo(() => listed(cards, today), [cards, today])

  const scrollToDay = useCallback((key, behavior = 'smooth') => {
    const el = scroller.current
    const at = days.indexOf(key)
    if (el && at >= 0) el.scrollTo({ left: offsets[at] - el.clientWidth / 2 + DAY_WIDTH / 2, behavior })
  }, [days, offsets])
  // The ribbon starts with today in the middle
  const setScroller = useCallback(el => {
    scroller.current = el
    if (!el) centered.current = false // gone (the list view): centered again when it's back
    if (el && !centered.current) { centered.current = true; el.scrollLeft = offsets[range.before] - el.clientWidth / 2 + DAY_WIDTH / 2 }
  }, [range.before, offsets])
  // Days added before the first keep what was in view where it was
  useLayoutEffect(() => {
    if (grown.current && scroller.current) { scroller.current.scrollLeft += offsets[MORE_DAYS]; grown.current = false }
  }, [range.before, offsets])
  function onScroll() {
    const el = scroller.current
    if (!el || grown.current) return
    const middle = days[dayAt(offsets, el.scrollLeft + el.clientWidth / 2)]
    if (middle) setMonth(monthLabel(middle))
    if (el.scrollLeft < EDGE) { grown.current = true; setRange(r => ({ ...r, before: r.before + MORE_DAYS })) }
    else if (el.scrollWidth - el.scrollLeft - el.clientWidth < EDGE) setRange(r => ({ ...r, after: r.after + MORE_DAYS }))
  }
  // Select the day `key` (`pick`: null for today, which then follows the date) and bring it to the middle: it scrolls there
  // when the ribbon has it, else the ribbon starts anew around it (it never grows all the way to a far day) and is there at once
  function goTo(key, pick) {
    setPicked(pick)
    setMonth(monthLabel(key)) // a jump may land where the ribbon already was, with no scroll to name the month
    if (days.includes(key)) return scrollToDay(key)
    setAnchor(key)
    setRange({ before: MORE_DAYS, after: MORE_DAYS * 2 })
    setJumping(key)
  }
  const goToday = () => goTo(today, null)
  const goToDay = key => goTo(key, key) // a day picked in the calendar
  useLayoutEffect(() => {
    if (jumping && days.includes(jumping)) { scrollToDay(jumping, 'auto'); setJumping(null) }
  }, [jumping, days, scrollToDay])

  // Calendar or list, this device's choice
  const controls = planner && !missing && (
    <Segmented iconOnly label="View" value={view} onChange={pickView} options={[['calendar', 'Calendar', CalendarDots], ['list', 'List', ListBullets]]} />
  )
  const menu = <>
    {/* On the day shown: the selected one in the calendar, today in the list */}
    <DropdownMenuItem disabled={off || !planner || missing} onSelect={() => act.newCard(view === 'list' ? today : selected)}><Plus /> New task</DropdownMenuItem>
    <DropdownMenuItem disabled={off} onSelect={() => setChoosing(true)}><Tag /> Properties</DropdownMenuItem>
  </>

  let body // only when its settings are read and its folder is there (WidgetFrame shows the other states)
  if (ready && planner && !missing) {
    const list = arranged.on(selected)
    const shown = [...FIXED, ...planner.properties]
    // Mark as done (usePlanner), told in a toast with Undo: a repeating card moved on, any other archived
    const titleOf = path => cardTitle(path, notes[path])
    // "Yoga moved to tomorrow, Sunday" (`key`: its new day; null: it has no date now), with Undo
    const toastMoved = (path, key, undo) => toast.success(
      key ? `${titleOf(path)} moved to ${shortTitle(key, today).replace(/^[A-Z][a-z]+,/, m => m.toLowerCase())}` : `${titleOf(path)} has no date now`,
      { action: { label: 'Undo', onClick: undo } })
    const markDone = path => {
      const done = act.markDone(path, today)
      if (!done) return
      if (done.next) toastMoved(path, done.next, done.undo)
      else toast.success(`${titleOf(path)} archived`, { action: { label: 'Undo', onClick: done.undo } })
    }
    // A card's date set to `value` (dragged onto a day, or picked on its date badge), told in a toast with Undo when its day changes
    const reschedule = (path, value) => {
      const text = notes[path]
      const old = text === undefined ? undefined : properties(text)[DATE]
      act.setProperty(path, DATE, value)
      const before = dateValue(old), after = dateValue(value)
      const day = after && dayKey(after)
      if (day !== (before && dayKey(before))) toastMoved(path, day, () => act.setProperty(path, DATE, old ?? ''))
    }
    const cardMenu = (path, inRow) => off ? undefined : (
      <CardMenu {...cardActions(path, notes[path], act, services)} onDone={() => markDone(path)} inRow={inRow} />
    )
    const cardProps = path => ({
      path, text: notes[path], properties: shown, always: FIXED, dateKeys: [DATE], badges: BADGES, scopeName: 'this planner', files,
      onChange: off ? undefined : (key, value) => key === DATE ? reschedule(path, value) : act.setProperty(path, key, value), options: act.valuesOf,
      onRemoveValue: off ? undefined : act.removeValue, valueCount: act.valueCount,
      chosen: services.tagColors.colors, onEditValue: off || !services.tagColors.canEdit ? undefined : act.editValue,
    })
    // A card dropped on a day gets that day as its date (its time is kept; text that isn't a day is replaced)
    const onDragEnd = ({ active, over }) => {
      setDragged(null)
      if (!over || !String(over.id).startsWith('day:')) return
      const path = active.data.current.path
      const key = over.id.slice(4)
      const old = notes[path] === undefined ? null : cardDate(notes[path])
      if (old && dayKey(old) === key) return // already dated that day
      reschedule(path, formatDate(droppedDate(notes[path], key)))
    }
    const paths = list.map(c => c.path)
    const visible = new Set(shownCards(paths, expanded.has(selected), dragged, limit))
    const more = expanded.has(selected) ? 0 : hiddenCards(paths, dragged, limit).length
    // A section's title row (a day, a group of the list): its name and + (New task on `key`, its first day)
    const sectionTitle = (label, key) => (
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1"><TrayTitle>{label}</TrayTitle></div>
        <Button variant="ghost" size="icon" aria-label={`New task: ${label}`} tooltip="New task" disabled={off} className={TRAY_BUTTON} onClick={() => act.newCard(key)}><Plus /></Button>
      </div>
    )
    // The list view: every card in grey groups of time (listed), each a white card of rows, its first 7 then Show N more
    // (as a day's cards: `expanded` holds `list:` and the group's key); Today always
    const groupCards = group => {
      const all = expanded.has(`list:${group.key}`)
      const paths = group.cards.map(c => c.path)
      return { shown: new Set(shownCards(paths, all)), more: all ? 0 : hiddenCards(paths).length }
    }
    if (view === 'list') body = (
      <>
        {groups[0]?.key !== 'today' && <Tray>{sectionTitle('Today', today)}</Tray>}
        {groups.map(group => {
          const { shown: rows, more: hidden } = groupCards(group)
          return (
            <Tray key={group.key}>
              {sectionTitle(group.label, group.first)}
              <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-card p-1">
                {group.cards.filter(c => rows.has(c.path)).map(({ path, overdue }) => (
                  <TaskRow key={path} path={path} text={notes[path]} overdue={overdue} menu={cardMenu(path, true)} onOpen={openFile} />
                ))}
              </div>
              <TrayFooter more={hidden} onShowMore={() => setExpanded(e => new Set(e).add(`list:${group.key}`))} />
            </Tray>
          )
        })}
      </>
    )
    else body = (
      <DndContext
        sensors={canEdit ? sensors : []}
        collisionDetection={collide}
        onDragStart={({ active }) => setDragged(active.data.current.path)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragged(null)}
      >
        {/* The ribbon in a tray like the cards' below, under a title row like a column's: the month in view, Today and a
            calendar to pick any day; it scrolls sideways to the tray's edges, with room above and below for a lifted day's shadow */}
        <Tray>
          <div className="flex items-center gap-1">
            <div className="min-w-0 flex-1"><TrayTitle>{month}</TrayTitle></div>
            <Button variant="ghost" size="md" className={cn(TRAY_ROW, 'shrink-0 gap-1.5 px-2', selected !== today && 'text-primary-ink hover:text-primary-ink')} onClick={goToday}><CrosshairSimple /> Today</Button>
            <DatePopover dayOnly date={keyDay(selected)} onPick={d => d && goToDay(dayKey(d))}>
              <Button variant="ghost" size="icon" aria-label="Go to a day" className={TRAY_BUTTON}><CalendarBlank /></Button>
            </DatePopover>
          </div>
          <div ref={setScroller} onScroll={onScroll} data-no-pull className="-mx-space-sm -mt-space-sm overflow-x-auto p-space-sm">
            <Ribbon days={days} today={today} selected={selected} count={arranged.count} onSelect={setPicked} />
          </div>
        </Tray>
        {/* The selected day's cards in a tray like a board's column, its title with + (New task on that day): its first cards and Show N more; a day without any is empty */}
        <Tray>
          {sectionTitle(shortTitle(selected, today), selected)}
          {/* The cards of a row are one height; Show more on a row of its own, one column wide (all of it on phones) */}
          {list.length > 0 && (
            <div ref={setGrid} className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-space-sm">
              {list.filter(c => visible.has(c.path)).map(({ path, overdue, undated }) => (
                <PlannerCard key={path} {...cardProps(path)} menu={cardMenu(path)} overdue={overdue} dashed={overdue || undated} onOpen={openFile} onOpenFolder={openFolder} />
              ))}
              <TrayFooter grid more={more} onShowMore={() => setExpanded(e => new Set(e).add(selected))} />
            </div>
          )}
        </Tray>
        <DragOverlay>
          {dragged && <NoteCard {...cardProps(dragged)} className="rotate-2 border-lift-edge shadow-lg" />}
        </DragOverlay>
      </DndContext>
    )
  }

  // The planner's dialogs sit beside its frame
  return <>
    <WidgetFrame
      title="Planner" subtitle={planner ? planner.folder || services.repoName : undefined} noun="planner" controls={controls} menu={menu}
      removeLabel="Remove planner" onRemove={onRemove} canEdit={canEdit} ready={ready} readable={!!planner}
      folder={planner && { name: planner.folder, missing, folders: ['', ...services.folders], sheetTitle: 'Planner from folder…', sheetText: 'Its notes become cards, each on the day of its date.', onPick: act.setFolder }}
    >{() => body}</WidgetFrame>
      {planner && (
        <PropertiesDialog
          open={choosing} noun="planner" shown={planner.properties} locked={FIXED} act={act}
          description="Their values show on the cards, without names. The date, repeat and description always show."
          lockedDescription="Every card has it; it comes back if removed"
          lockedError={key => FIXED.includes(key) ? `The ${key} is always shown.` : null}
          onClose={() => setChoosing(false)}
        />
      )}
  </>
}

// The cards' title: "Today, Saturday", "Tomorrow, Sunday", "Yesterday, Friday"; another day "November 12" ("November 12, 2027" in another year)
const RELATIVE = { [-1]: 'Yesterday', 0: 'Today', 1: 'Tomorrow' }
const shortTitle = (key, today) => {
  const { year, month, day } = keyDay(key)
  const date = new Date(Date.UTC(year, month - 1, day))
  const near = RELATIVE[daysBetween(today, key)]
  if (near) return `${near}, ${date.toLocaleDateString('en', { weekday: 'long', timeZone: 'UTC' })}`
  return date.toLocaleDateString('en', { month: 'long', day: 'numeric', ...(year !== keyDay(today).year && { year: 'numeric' }), timeZone: 'UTC' })
}

// "Friday, 6 November 2026"
const dayTitle = key => {
  const { year, month, day } = keyDay(key)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// The days side by side, a short line between months that takes its own place (MONTH_GAP: the days' gap on each side)
function Ribbon({ days, today, selected, count, onSelect }) {
  return (
    <div className="flex w-max items-center">
      {days.map((key, i) => (
        <Fragment key={key}>
          {i > 0 && keyDay(key).day === 1 && (
            <div className="flex shrink-0 justify-center" style={{ width: MONTH_GAP }}>
              <Separator orientation="vertical" className="data-[orientation=vertical]:h-12" />
            </div>
          )}
          <Day dayKey={key} today={key === today} selected={key === selected} count={count(key)} onSelect={onSelect} />
        </Fragment>
      ))}
    </div>
  )
}


// One day of the ribbon, a drop target for cards: its weekday, number and, when it has cards, how many.
// A Button (white and outlined like a card, lifting on hover like one: hover-lift; filled for the selected day) so it focuses like every control; today has a ring.
function Day({ dayKey: key, today, selected, count, onSelect }) {
  const { setNodeRef, isOver } = useDroppable({ id: dayCellId(key) })
  const { year, month, day } = keyDay(key)
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return (
    <div className="shrink-0 px-1" style={{ width: DAY_WIDTH }}>
      <Button
        ref={setNodeRef}
        variant={selected ? 'default' : 'ghost'}
        aria-pressed={selected}
        aria-label={`${dayTitle(key)}${today ? ', today' : ''}${count ? `, ${plural(count, 'card')}` : ''}`}
        onClick={() => onSelect(key)}
        className={cn('h-auto w-full flex-col gap-0.5 rounded-lg border px-0 py-2.5 font-normal', selected ? 'border-transparent' : cn('hover-lift border-border hover:text-foreground', isOver ? 'bg-secondary hover:bg-secondary' : 'bg-card hover:bg-card'), today && 'border-primary ring-1 ring-inset ring-primary hover:border-primary')}
      >
        <span className={cn('text-xs', !selected && 'text-muted-foreground')}>{weekday}</span>
        <span className="text-base font-semibold tabular-nums">{day}</span>
        <span className={cn('flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs tabular-nums', count ? (selected ? 'bg-primary-foreground/20' : 'bg-primary/15 text-primary-ink') : 'invisible')}>{count || 0}</span>
      </Button>
    </div>
  )
}

// A card as a row of the list view (ListRow): its title, its date under it and, when it repeats, a small circling-arrows
// icon (grey, like the line) and how often right after it; its ⋯; it opens the note. `overdue` (dated before today, listed
// under Today): its title faded and its date red
function TaskRow({ path, text, overdue, menu, onOpen }) {
  const date = text === undefined ? null : cardDate(text)
  const repeat = text === undefined ? '' : properties(text)[REPEAT]
  const kind = parseRecurrence(repeat)?.kind
  return (
    <ListRow
      title={<span className={cn(overdue && 'opacity-50')}>{cardTitle(path, text)}</span>}
      description={<>
        <span className={cn(overdue && 'text-destructive-ink')}>{date ? dateLabel(date) : 'No date'}</span>
        {(kind === 'repeat' || kind === 'unset') && <> · <ArrowsClockwise className="inline size-3 align-[-0.125em]" /> {repeatLabel(repeat)}</>}
      </>}
      trailing={menu}
      onClick={() => onOpen(path)}
    />
  )
}

// A card of the selected day, dragged by a press on it (dropped on a day of the ribbon). One only listed under today
// because it has no date or is late (`dashed`) has a dashed outline; a late one (`overdue`) also its title faded and its
// date red (NoteCard)
function PlannerCard({ path, dashed, onOpen, onOpenFolder, files, ...props }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: dayCardId(path), data: { path } })
  return (
    <NoteCard
      ref={setNodeRef}
      path={path} files={files} {...props}
      className={cn(NO_CALLOUT, dashed && 'border-dashed border-muted-foreground/50', isDragging && 'opacity-40')}
      onClick={cardClick(path, files, onOpen, onOpenFolder)}
      {...attributes} {...ownListeners(listeners)}
    />
  )
}
