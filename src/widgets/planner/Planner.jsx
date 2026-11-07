import { toast } from 'sonner'
import { Fragment, useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react'
import { DotsThree, X, Tag, FolderOpen, CalendarBlank, CrosshairSimple, CalendarDots, ListBullets, CalendarDot, ArrowsClockwise } from '@phosphor-icons/react'
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, useDraggable, useDroppable, pointerWithin } from '@dnd-kit/core'
import { cn } from '@/lib/utils.js'
import { Button } from '@/components/ui/button.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Segmented } from '@/components/ui/segmented.jsx'
import { ListRow } from '@/components/ui/list-row.jsx'
import { Tray, TrayTitle, TrayFooter, TRAY_BUTTON, TRAY_ROW } from '@/components/ui/tray.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import NoteCard, { NO_CALLOUT, ownListeners, cardClick } from '@/components/NoteCard.jsx'
import CardMenu from '@/components/CardMenu.jsx'
import CheckListModal from '@/components/CheckListModal.jsx'
import ConfirmModal from '@/components/ConfirmModal.jsx'
import Spinner from '@/components/Spinner.jsx'
import EmptyState from '@/components/EmptyState.jsx'
import FolderSheet from '@/components/FolderSheet.jsx'
import DatePopover from '@/components/DatePopover.jsx'
import { shownCards, hiddenCards } from '@/lib/trayCards.js'
import { displayName } from '@/lib/files.js'
import { formatDate } from '@/lib/dates.js'
import { noteTitle, properties, valueList, DESCRIPTION } from '@/lib/frontmatter.js'
import { DATE, REPEAT, FIXED, listed, plan, addDays, daysBetween, dayOffsets, dayAt, keyDay, dayKey, cardDate, dateValue, droppedDate, monthLabel } from './planner.js'
import { usePlanner } from './usePlanner.js'
import { useToday } from './useToday.js'
import { BADGES } from './RecurrenceField.jsx'
import { WEEKDAYS, parseRecurrence } from './recurrence.js'

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
  const [expanded, setExpanded] = useState(() => new Set()) // keys of the days showing all their cards
  const [range, setRange] = useState({ before: MORE_DAYS, after: MORE_DAYS * 2 }) // days shown before and after today
  const [dragged, setDragged] = useState(null) // the path of the card being dragged
  const [choosing, setChoosing] = useState(false) // the Properties sheet
  const [relocating, setRelocating] = useState(false) // picking another folder, its own being gone
  const [viewHere, setViewHere] = useState(null) // calendar or list picked where it can't be saved (read only): this screen only
  const view = viewHere ?? planner?.view
  const pickView = next => { if (off) setViewHere(next); else { setViewHere(null); act.setView(next) } }
  const [dropping, setDropping] = useState(null) // the property whose removal is being confirmed
  const [jumping, setJumping] = useState(null) // a day picked in the calendar, scrolled to once the ribbon has it
  const [month, setMonth] = useState(() => monthLabel(today)) // the month of the day in the middle of the ribbon, its title
  const scroller = useRef(null)
  const grown = useRef(false) // days were added before the first: the view moves by their width to keep its place
  const centered = useRef(false)
  const off = !canEdit || !planner || missing
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

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

  const menu = (
    <div className="flex shrink-0 items-center gap-space-sm">
      {/* Calendar or list, saved in the planner's settings (where it can't be, on this screen only) */}
      {planner && !missing && (
        <div className="w-24">
          <Segmented iconOnly label="View" value={view} onChange={pickView} options={[['calendar', 'Calendar', CalendarDots], ['list', 'List', ListBullets]]} />
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost-outline" size="icon" aria-label="Planner actions" className="shrink-0 border-muted-foreground/50">
            <DotsThree weight="bold" size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
          <DropdownMenuItem disabled={off} onSelect={() => setChoosing(true)}><Tag /> Properties</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={!canEdit} onSelect={onRemove}><X /> Remove planner</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  let body
  if (!ready) body = <div className="flex justify-center py-12"><Spinner /></div>
  else if (!planner) body = <p className="py-6 text-center text-sm text-muted-foreground">This planner's settings can't be read.</p>
  else if (missing) body = <EmptyState message={`Its folder “${planner.folder}” is gone.`} action={{ label: 'Select folder', icon: <FolderOpen />, onClick: () => setRelocating(true), disabled: !canEdit }} />
  else {
    const list = arranged.on(selected)
    const shown = [...FIXED, ...planner.properties]
    // Mark as done (usePlanner), told in a toast with Undo: a repeating card moved on, any other archived
    const titleOf = path => notes[path] === undefined ? displayName(path) : noteTitle(notes[path], displayName(path))
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
    const cardMenu = path => off ? undefined : (
      <CardMenu
        path={path}
        title={notes[path] === undefined ? displayName(path) : noteTitle(notes[path], displayName(path))}
        onTitle={act.canTitle(path) ? title => act.setTitle(path, title) : undefined}
        description={notes[path] === undefined ? '' : valueList(properties(notes[path])[DESCRIPTION] ?? '').join(', ')}
        onDescription={act.canTitle(path) ? text => act.setDescription(path, text) : undefined}
        onRename={name => services.rename({ name: path.slice(path.lastIndexOf('/') + 1), path, type: 'file' }, name)}
        onDuplicate={() => services.duplicate({ name: path.slice(path.lastIndexOf('/') + 1), path, type: 'file' })}
        onDone={() => markDone(path)}
        onDelete={() => act.deleteCard(path)}
      />
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
    const visible = new Set(shownCards(paths, expanded.has(selected), dragged))
    // The list view: every card in grey groups of time (listed), each a white card of rows; Today always, with New task
    const newTask = <TrayFooter more={0} newLabel="New task" onNew={() => act.newCard(today)} disabled={off} />
    if (view === 'list') body = (
      <>
        {groups[0]?.key !== 'today' && <Tray><TrayTitle>Today</TrayTitle>{newTask}</Tray>}
        {groups.map(group => (
          <Tray key={group.key}>
            <TrayTitle>{group.label}</TrayTitle>
            <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-card p-1">
              {group.cards.map(({ path, overdue, undated }) => (
                <TaskRow key={path} path={path} text={notes[path]} dashed={overdue || undated} menu={cardMenu(path)} onOpen={openFile} />
              ))}
            </div>
            {group.key === 'today' && newTask}
          </Tray>
        ))}
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
            calendar to pick any day; it scrolls sideways to the tray's edges */}
        <Tray>
          <div className="flex items-center gap-1">
            <div className="min-w-0 flex-1"><TrayTitle>{month}</TrayTitle></div>
            <Button variant="ghost" size="md" className={cn(TRAY_ROW, 'shrink-0 gap-1.5 px-2', selected !== today && 'text-primary hover:text-primary')} onClick={goToday}><CrosshairSimple /> Today</Button>
            <DatePopover date={keyDay(selected)} onPick={d => d && goToDay(dayKey(d))}>
              <Button variant="ghost" size="icon" aria-label="Go to a day" className={TRAY_BUTTON}><CalendarBlank /></Button>
            </DatePopover>
          </div>
          <div ref={setScroller} onScroll={onScroll} data-no-pull className="-mx-space-sm overflow-x-auto px-space-sm pb-space-sm">
            <Ribbon days={days} today={today} selected={selected} count={arranged.count} onSelect={setPicked} />
          </div>
        </Tray>
        {/* The selected day's cards in a tray like a board's column: its first cards, Show N more, New task; a day without any has only New task */}
        <Tray>
          <TrayTitle>{shortTitle(selected, today)}</TrayTitle>
          {list.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] items-start gap-space-sm">
              {list.filter(c => visible.has(c.path)).map(({ path, overdue, undated }) => (
                <PlannerCard key={path} {...cardProps(path)} menu={cardMenu(path)} dashed={overdue || undated} onOpen={openFile} onOpenFolder={openFolder} />
              ))}
            </div>
          )}
          <TrayFooter
            more={expanded.has(selected) ? 0 : hiddenCards(paths, dragged).length}
            onShowMore={() => setExpanded(e => new Set(e).add(selected))}
            newLabel="New task" onNew={() => act.newCard(selected)} disabled={off}
          />
        </Tray>
        <DragOverlay>
          {dragged && <NoteCard {...cardProps(dragged)} className="rotate-2 border-lift-edge shadow-lg" />}
        </DragOverlay>
      </DndContext>
    )
  }

  return (
    <section className="flex shrink-0 flex-col gap-space-sm">
      <div className="flex min-h-control items-center gap-space-sm">
        {/* "Planner", then its folder from the repo's root under it, muted */}
        <h2 className="flex min-w-0 flex-1 flex-col px-space-xs">
          <span className="text-base font-bold">Planner</span>
          {planner && <span className="truncate text-sm text-muted-foreground">{planner.folder || services.repoName}</span>}
        </h2>
        {menu}
      </div>
      {body}
      {relocating && planner && (
        <FolderSheet title="Planner from folder…" folders={['', ...services.folders]} onPick={folder => { act.setFolder(folder); return null }} onClose={() => setRelocating(false)}>
          <p className="text-muted-foreground text-xs">Its notes become cards, each on the day of its date.</p>
        </FolderSheet>
      )}
      {choosing && planner && (
        <CheckListModal
          title="Properties"
          description="Their values show on the cards, without names. The date, repeat and description always show."
          lockedDescription="Every card has it; it comes back if removed"
          locked={FIXED}
          items={[...planner.properties, ...act.propertyKeys().filter(k => !FIXED.includes(k) && !planner.properties.includes(k))]}
          selected={planner.properties}
          onChange={act.setProperties}
          addLabel="New property"
          onAdd={key => {
            const error = FIXED.includes(key) ? `The ${key} is always shown.` : act.keyError(key)
            if (error) return error
            if (!planner.properties.includes(key)) act.setProperties([...planner.properties, key])
            return null
          }}
          onRename={(from, to) => FIXED.includes(to) ? `The ${to} is always shown.` : act.renameProperty(from, to)}
          onDelete={key => { setChoosing(false); setDropping(key) }}
          empty="Its notes have no other properties yet."
          onClose={() => setChoosing(false)}
        />
      )}
      {dropping && (
        <ConfirmModal
          title={`Remove property “${dropping}”?`}
          description={`It's removed, with its value, from ${act.notesWith(dropping)} note${act.notesWith(dropping) === 1 ? '' : 's'} in this planner's folder. It's removed from GitHub when you sync.`}
          confirm="Remove"
          onConfirm={() => { act.removeProperty(dropping); setDropping(null) }}
          onClose={() => setDropping(null)}
        />
      )}
    </section>
  )
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
        aria-label={`${dayTitle(key)}${today ? ', today' : ''}${count ? `, ${count} card${count === 1 ? '' : 's'}` : ''}`}
        onClick={() => onSelect(key)}
        className={cn('h-auto w-full flex-col gap-0.5 rounded-lg border px-0 py-2.5 font-normal', selected ? 'border-transparent' : cn('hover-lift border-border', isOver ? 'bg-secondary hover:bg-secondary' : 'bg-card hover:bg-card'), today && 'border-primary ring-1 ring-inset ring-primary hover:border-primary')}
      >
        <span className={cn('text-xs', !selected && 'text-muted-foreground')}>{weekday}</span>
        <span className="text-base font-semibold tabular-nums">{day}</span>
        <span className={cn('flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs tabular-nums', count ? (selected ? 'bg-primary-foreground/20' : 'bg-primary/15 text-primary') : 'invisible')}>{count || 0}</span>
      </Button>
    </div>
  )
}

// A card as a row of the list view (ListRow): its repeat's icon (circling arrows in the accent color for a repeat, a
// calendar with a dot for one-time), its title, its date (and repeat) under it, its ⋯; it opens the note. `dashed`:
// listed under Today because it has no date or is late
function TaskRow({ path, text, dashed, menu, onOpen }) {
  const name = displayName(path)
  const date = text === undefined ? null : cardDate(text)
  const repeat = text === undefined ? '' : properties(text)[REPEAT]
  const repeats = parseRecurrence(repeat)?.kind === 'repeat' // "recurring" without a rule is done like a one-time card
  const Icon = repeats ? ArrowsClockwise : CalendarDot
  return (
    <ListRow
      icon={<Icon className={cn('size-4', repeats ? 'text-primary' : 'text-muted-foreground')} />}
      title={text === undefined ? name : noteTitle(text, name)}
      description={`${date ? formatDate(date) : 'No date'}${repeats || parseRecurrence(repeat)?.kind === 'unset' ? ` · ${repeat.charAt(0).toUpperCase()}${repeat.slice(1)}` : ''}`}
      trailing={menu}
      onClick={() => onOpen(path)}
      className={cn(dashed && 'border border-dashed border-muted-foreground/50')}
    />
  )
}

// A card of the selected day, dragged by a press on it (dropped on a day of the ribbon); a card that's only
// there because it has no date or is late (`dashed`) has a dashed outline
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
