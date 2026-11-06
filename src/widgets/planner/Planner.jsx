import { useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react'
import { DotsThree, X, Tag, CalendarBlank } from '@phosphor-icons/react'
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, useDraggable, useDroppable, pointerWithin } from '@dnd-kit/core'
import { cn } from '@/lib/utils.js'
import { Button } from '@/components/ui/button.jsx'
import { Tray, TrayTitle, TrayFooter } from '@/components/ui/tray.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import NoteCard, { NO_CALLOUT, ownListeners, cardClick } from '@/components/NoteCard.jsx'
import CardMenu from '@/components/CardMenu.jsx'
import CheckListModal from '@/components/CheckListModal.jsx'
import ConfirmModal from '@/components/ConfirmModal.jsx'
import Spinner from '@/components/Spinner.jsx'
import { shownCards, hiddenCards } from '@/lib/trayCards.js'
import { displayName } from '@/lib/files.js'
import { formatDate } from '@/lib/dates.js'
import { noteTitle, properties, valueList, DESCRIPTION } from '@/lib/frontmatter.js'
import { DATE, plan, addDays, keyDay, dayKey, cardDate, droppedDate, monthLabel } from './planner.js'
import { usePlanner } from './usePlanner.js'
import { useToday } from './useToday.js'

// The ribbon: each day is DAY_WIDTH wide; it starts with a window of days around today and grows by
// MORE_DAYS on either side as it's scrolled near an end (EDGE), so it never ends
const DAY_WIDTH = 56
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
  const [anchor] = useState(today) // the ribbon's days are counted from where it started, so a new day doesn't shift them
  const [expanded, setExpanded] = useState(() => new Set()) // keys of the days showing all their cards
  const [range, setRange] = useState({ before: MORE_DAYS, after: MORE_DAYS * 2 }) // days shown before and after today
  const [dragged, setDragged] = useState(null) // the path of the card being dragged
  const [choosing, setChoosing] = useState(false) // the Properties sheet
  const [dropping, setDropping] = useState(null) // the property whose removal is being confirmed
  const scroller = useRef(null)
  const grown = useRef(0) // the width added before the first day while it's scrolled to, to keep its place
  const centered = useRef(false)
  const off = !canEdit || !planner || missing
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  const days = useMemo(() => Array.from({ length: range.before + range.after + 1 }, (_, i) => addDays(anchor, i - range.before)), [anchor, range])
  const arranged = useMemo(() => plan(cards, today), [cards, today])

  const scrollToDay = useCallback((key, behavior = 'smooth') => {
    const el = scroller.current
    const at = days.indexOf(key)
    if (el && at >= 0) el.scrollTo({ left: at * DAY_WIDTH - el.clientWidth / 2 + DAY_WIDTH / 2, behavior })
  }, [days])
  // The ribbon starts with today in the middle
  const setScroller = useCallback(el => {
    scroller.current = el
    if (el && !centered.current) { centered.current = true; el.scrollLeft = range.before * DAY_WIDTH - el.clientWidth / 2 + DAY_WIDTH / 2 }
  }, [range.before])
  // Days added before the first keep what was in view where it was
  useLayoutEffect(() => {
    if (grown.current && scroller.current) { scroller.current.scrollLeft += grown.current; grown.current = 0 }
  }, [range.before])
  function onScroll() {
    const el = scroller.current
    if (!el || grown.current) return
    if (el.scrollLeft < EDGE) { grown.current = MORE_DAYS * DAY_WIDTH; setRange(r => ({ ...r, before: r.before + MORE_DAYS })) }
    else if (el.scrollWidth - el.scrollLeft - el.clientWidth < EDGE) setRange(r => ({ ...r, after: r.after + MORE_DAYS }))
  }
  function goToday() {
    setPicked(null)
    scrollToDay(today)
  }

  const menu = (
    <div className="flex shrink-0 items-center gap-space-sm">
      <Button variant="ghost-outline" className="border-muted-foreground/50" onClick={goToday}><CalendarBlank /> Today</Button>
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
  else if (missing) body = <p className="py-6 text-center text-sm text-muted-foreground">Its folder “{planner.folder}” is gone.</p>
  else {
    const list = arranged.on(selected)
    const shown = [DATE, ...planner.properties]
    const cardMenu = path => off ? undefined : (
      <CardMenu
        path={path}
        title={notes[path] === undefined ? displayName(path) : noteTitle(notes[path], displayName(path))}
        onTitle={act.canTitle(path) ? title => act.setTitle(path, title) : undefined}
        description={notes[path] === undefined ? '' : valueList(properties(notes[path])[DESCRIPTION] ?? '').join(', ')}
        onDescription={act.canTitle(path) ? text => act.setDescription(path, text) : undefined}
        onRename={name => services.rename({ name: path.slice(path.lastIndexOf('/') + 1), path, type: 'file' }, name)}
        onDuplicate={() => services.duplicate({ name: path.slice(path.lastIndexOf('/') + 1), path, type: 'file' })}
        onDelete={() => act.deleteCard(path)}
      />
    )
    const cardProps = path => ({
      path, text: notes[path], properties: shown, always: [DATE], dateKeys: [DATE], scopeName: 'this planner', files,
      onChange: off ? undefined : act.setProperty, options: act.valuesOf,
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
      act.setProperty(path, DATE, formatDate(droppedDate(notes[path], key)))
    }
    const paths = list.map(c => c.path)
    const visible = new Set(shownCards(paths, expanded.has(selected), dragged))
    body = (
      <DndContext
        sensors={canEdit ? sensors : []}
        collisionDetection={collide}
        onDragStart={({ active }) => setDragged(active.data.current.path)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragged(null)}
      >
        {/* The ribbon in a tray like the cards' below; it scrolls sideways to the tray's edges */}
        <Tray>
          <div ref={setScroller} onScroll={onScroll} data-no-pull className="-mx-space-sm overflow-x-auto px-space-sm">
            <Ribbon days={days} today={today} selected={selected} count={arranged.count} onSelect={setPicked} />
          </div>
        </Tray>
        {/* The selected day's cards in a tray like a board's column: its first cards, Show N more, New card */}
        <Tray>
          <div className="flex items-center gap-1">
            <div className="min-w-0 flex-1"><TrayTitle>{dayTitle(selected)}{selected === today && ' · Today'}</TrayTitle></div>
            <span className="flex size-control-md shrink-0 items-center justify-center text-sm tabular-nums text-muted-foreground">{list.length}</span>
          </div>
          {list.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] items-start gap-space-sm">
              {list.filter(c => visible.has(c.path)).map(({ path, overdue, undated }) => (
                <PlannerCard key={path} {...cardProps(path)} menu={cardMenu(path)} dashed={overdue || undated} onOpen={openFile} onOpenFolder={openFolder} />
              ))}
            </div>
          ) : <p className="px-space-sm py-space-sm text-sm text-muted-foreground">Nothing planned for this day.</p>}
          <TrayFooter
            more={expanded.has(selected) ? 0 : hiddenCards(paths, dragged).length}
            onShowMore={() => setExpanded(e => new Set(e).add(selected))}
            newLabel="New card" onNew={() => act.newCard(selected)} disabled={off}
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
      {choosing && planner && (
        <CheckListModal
          title="Properties"
          description="Their values show on the cards, without names. The date and description always show."
          locked={[DATE]}
          items={[...planner.properties, ...act.propertyKeys().filter(k => k !== DATE && !planner.properties.includes(k))]}
          selected={planner.properties}
          onChange={act.setProperties}
          addLabel="New property"
          onAdd={key => {
            const error = key === DATE ? 'The date is always shown.' : act.keyError(key)
            if (error) return error
            if (!planner.properties.includes(key)) act.setProperties([...planner.properties, key])
            return null
          }}
          onRename={(from, to) => to === DATE ? 'The date is always shown.' : act.renameProperty(from, to)}
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

// "Friday, 6 November 2026"
const dayTitle = key => {
  const { year, month, day } = keyDay(key)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// The days side by side, a month's name over its first days (it stays in view while that month is scrolled through)
function Ribbon({ days, today, selected, count, onSelect }) {
  const months = []
  for (const key of days) {
    const label = monthLabel(key)
    if (months.at(-1)?.label === label) months.at(-1).days.push(key)
    else months.push({ label, days: [key] })
  }
  return (
    <div className="flex w-max flex-col gap-1">
      <div className="flex">
        {months.map(m => (
          <div key={m.label} className="shrink-0" style={{ width: m.days.length * DAY_WIDTH }}>
            <span className="sticky left-0 inline-block px-space-xs text-xs font-semibold text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </div>
      <div className="flex">
        {days.map(key => <Day key={key} dayKey={key} today={key === today} selected={key === selected} count={count(key)} onSelect={onSelect} />)}
      </div>
    </div>
  )
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// One day of the ribbon, a drop target for cards: its weekday, number and, when it has cards, how many.
// A Button (ghost, filled for the selected day) so it looks and focuses like every control; today has a ring.
function Day({ dayKey: key, today, selected, count, onSelect }) {
  const { setNodeRef, isOver } = useDroppable({ id: dayCellId(key) })
  const { year, month, day } = keyDay(key)
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return (
    <Button
      ref={setNodeRef}
      variant={selected ? 'default' : 'ghost'}
      aria-pressed={selected}
      aria-label={`${dayTitle(key)}${today ? ', today' : ''}${count ? `, ${count} card${count === 1 ? '' : 's'}` : ''}`}
      onClick={() => onSelect(key)}
      style={{ width: DAY_WIDTH }}
      className={cn('h-auto shrink-0 flex-col gap-0.5 px-0 py-1.5 font-normal', today && 'ring-1 ring-primary', isOver && !selected && 'bg-secondary')}
    >
      <span className={cn('text-xs', !selected && 'text-muted-foreground')}>{weekday}</span>
      <span className="text-base font-semibold tabular-nums">{day}</span>
      <span className={cn('flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs tabular-nums', count ? (selected ? 'bg-primary-foreground/20' : 'bg-primary/15 text-primary') : 'invisible')}>{count || 0}</span>
    </Button>
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
