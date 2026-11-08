import { useState } from 'react'
import { CaretDown, Check, PencilSimple } from '@phosphor-icons/react'
import { cn, own } from '@/lib/utils'
import { PLACEHOLDER } from './ui/placeholder.jsx'
import { Badge } from './ui/badge.jsx'
import { Input } from './ui/input.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import { Separator } from './ui/separator.jsx'
import ValuesModal from './ValuesModal.jsx'
import { useSingleOpen } from '../hooks/useSingleOpen.jsx'
import { valueList, valueColors, DESCRIPTION } from '../lib/frontmatter.js'
import InlineMarkdown from './InlineMarkdown.jsx'
import { DateField } from './DateBadge.jsx'
import { valueDate } from '../lib/markdown.js'
import { formatDate, dateLabel, daysAgo } from '../lib/dates.js'
import { plural } from '../lib/plural.js'


// A value badge's tone (Badge): its value's hue within its property (--tag-N, index.css); none (grey) when empty
const toneOf = color => color === undefined ? undefined : `var(--tag-${color})`

// A note's properties (lib/frontmatter.js), in the file's order: its
// description as muted text with its markdown links (`path`: the note's, `files`:
// the repo's, for relative links; whoever shows this opens them: see
// `openLink`) (`clamp`: cut after three lines), the others as
// badges, one per value, without the property's name (its tooltip has it), so
// badges listed before the description show above it and the rest below.
// `props`: [{ key, value }]. `title`: in a box with
// that small title on top, on a light grey fill with badges in the card's color (the note's preview); without it, bare (board cards).
// With `onChange(key, value)` the badges open a popover to change the property
// (`options(key)`: the values to choose from) and an empty property shows its
// name as a badge to fill; without it they're plain and empty ones aren't shown.
// With `onRemoveValue(key, value)` and `onEditValue(key, from, to, color)` the popover has a
// menu point Edit values under the popover's list that opens a dialog (`ValuesModal`) with every value
// of the property: to add one, edit one (name and color, for that value everywhere in the same
// scope) or remove it (a 🗑 that asks first, then empties that value everywhere it's used);
// `valueCount(key, value)`: in how many notes; `scopeName`: where, "this folder";
// `chosen` ({ key: { value: color } }, lib/tagColors.js) are the colors picked so far.
// `dateKeys`: properties that are always dates (a planner's date), a calendar even while none has a value yet, reading "No date" while empty or not a day;
// `overdue`: their dates are past (a planner's late card): red.
// `badges` ({ key: Component }): properties a widget shows its own way (a planner's type: widgets/planner/RecurrenceField.jsx),
// one badge for the property, given `prop`, all `props` and `onChange`.
export default function PropertyBadges({ props, path, files, clamp, title, className, onChange, options, onRemoveValue, valueCount, scopeName, onEditValue, chosen, dateKeys, badges, overdue }) {
  const [removing, setRemoving] = useState(null) // { key, value } being confirmed
  const [managing, setManaging] = useState(null) // the key whose values are in the dialog
  const parts = [] // [{ text }] or [{ badges: [{ id, prop, label }] }], in order
  for (const prop of props) {
    const values = valueList(prop.value)
    if (prop.key === DESCRIPTION) { if (values.length) parts.push({ text: values.join(', ') }); continue }
    if (!values.length && !onChange) continue
    if (!parts.at(-1)?.badges) parts.push({ badges: [] })
    const labels = badges?.[prop.key] || !values.length ? [values[0] ?? null] : values
    parts.at(-1).badges.push(...labels.map((label, i) => ({ id: `${prop.key}:${i}`, prop, label })))
  }
  if (!parts.length) return null
  // Each property's values (all it can have, so none shares a color with another)
  const colors = Object.fromEntries([...new Set(props.map(p => p.key))].map(key =>
    [key, valueColors(key, [...(options?.(key) ?? []), ...valueList(props.find(p => p.key === key).value)], chosen?.[key])]))
  const body = parts.map((part, i) => part.text
    ? <InlineMarkdown key={i} text={part.text} path={path} files={files} onChange={onChange && (text => onChange(DESCRIPTION, text))} className={cn('break-words text-sm text-muted-foreground', clamp && 'line-clamp-3')} />
    : (
      <div key={i} className="flex flex-wrap gap-space-xs">
        {part.badges.map(({ id, prop, label }) => badges?.[prop.key]
          ? <Custom key={id} as={badges[prop.key]} prop={prop} props={props} onChange={onChange} />
          : isDateProp(prop, options, dateKeys)
          ? <DateValue key={id} prop={prop} onChange={onChange} emptyLabel={dateKeys?.includes(prop.key) ? 'No date' : prop.key} late={overdue && dateKeys?.includes(prop.key)} />
          : onChange
          ? <EditableBadge key={id} prop={prop} label={label} color={colors[prop.key].get(label)} options={options} onChange={onChange} onManage={(onEditValue || onRemoveValue) && (() => setManaging(prop.key))} />
          : (
            <Badge key={id} tone={toneOf(colors[prop.key].get(label))}><span className="truncate">{label}</span></Badge>
          ))}
      </div>
    ))
  const confirm = removing && (
    <ConfirmModal
      title={`Remove “${removing.value}” from ${removing.key}?`}
      description={`It becomes empty in ${plural(valueCount(removing.key, removing.value), 'note')} in ${scopeName}. It changes on GitHub when you sync.`}
      onConfirm={() => { onRemoveValue(removing.key, removing.value); setRemoving(null) }}
      onClose={() => setRemoving(null)}
    />
  )
  const managed = managing && props.find(p => p.key === managing)
  const manage = managed && (
    <ValuesModal
      name={managing}
      values={[...new Set([...(options?.(managing) ?? []), ...valueList(managed.value)])]}
      colors={colors[managing]}
      count={value => valueCount(managing, value)}
      scopeName={scopeName}
      replaces={!Array.isArray(managed.value) && managed.value ? managed.value : null}
      onAdd={value => onChange(managing, addedValue(managed.value, value))}
      onEdit={onEditValue && ((from, to, color) => onEditValue(managing, from, to, color))}
      onRemove={onRemoveValue && (value => { setManaging(null); setRemoving({ key: managing, value }) })}
      onClose={() => setManaging(null)}
    />
  )
  if (!title) return <div className={cn('flex flex-col gap-space-sm', className)}>{body}{confirm}{manage}</div>
  return (
    <div className={className}>
      <section className="flex flex-col gap-space rounded-xl bg-secondary/50 p-space">
        <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
        <div className="flex flex-col gap-space-sm">{body}</div>
      </section>
      {confirm}{manage}
    </div>
  )
}

// A widget's own badge for a property (`badges`)
const Custom = ({ as: Component, ...props }) => <Component {...props} />

// A property's value `current` with `value` added (a single value is replaced; one already there stays)
const addedValue = (current, value) => {
  if (!Array.isArray(current)) return value
  return current.includes(value) ? current : [...current, value]
}

// Closing a popover gives the focus back to its badge; when another popover has just opened
// (it has the focus), that would pull the focus out of it and close it too
const keepFocusInOtherPopover = e => {
  if (document.activeElement?.closest('[data-badge-popover]')) e.preventDefault()
}

// A date property: its value one date ("17 Oct 2026"), or, while empty, every value the notes nearby have one
function isDateProp(prop, options, dateKeys) {
  if (Array.isArray(prop.value)) return false
  if (dateKeys?.includes(prop.key)) return true // a planner's date, even while no note has one; text that isn't a day counts as none
  if (prop.value) return !!valueDate(prop.value)
  const known = options?.(prop.key) ?? []
  return known.length > 0 && known.every(v => valueDate(v))
}

// A date property's badge, like a date in the text (DateField: a calendar icon on the left, no ▾): with `onChange`
// it opens a calendar and a time field to change it (the same day again empties it). While empty, `emptyLabel` (its name, or "No date" for a planner's).
// `late`: a past date, the whole badge red (Badge's red tone: its tint, text and icon), saying "N days ago" in place of the date
function DateValue({ prop, onChange, emptyLabel, late }) {
  const date = valueDate(prop.value)
  const pick = picked => onChange(prop.key, picked ? formatDate(picked) : '')
  return (
    <DateField
      label={date ? (late && daysAgo(date)) || dateLabel(date) : emptyLabel} date={date} onPick={onChange && pick}
      tone={late ? 'var(--destructive)' : undefined}
      className={cn(!date && PLACEHOLDER)} {...(onChange ? own : {})}
    />
  )
}

// One value of a property as a badge with a ▾ that opens the property's popover
// (`label` null: the property is empty and shows its name)
function EditableBadge({ prop, label, color, options, onChange, onManage }) {
  const [open, setOpen] = useSingleOpen()
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge
          as="button"
          type="button"
          tone={toneOf(color)}
          hoverable
          className={cn('cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring', label === null && PLACEHOLDER)}
          {...own}
        >
          <span className="truncate">{label ?? prop.key}</span>
          <CaretDown className="size-3 shrink-0" />
        </Badge>
      </PopoverTrigger>
      {/* Opening it doesn't focus the field (the keyboard on a phone): the panel takes the focus, a tap or Tab reaches the field */}
      <PopoverContent {...own} data-badge-popover tabIndex={-1} onOpenAutoFocus={e => { e.preventDefault(); e.currentTarget.focus() }} onCloseAutoFocus={keepFocusInOtherPopover}>
        <ValueChooser prop={prop} options={options?.(prop.key) ?? []} onChange={onChange} onManage={onManage && (() => { setOpen(false); onManage() })} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

// The values to choose from (what other notes nearby have, plus what this one
// has), a field to type a new one. A property with a list of values toggles them
// and stays open; one with a single value takes the chosen one (choosing it
// again empties it) and closes.
function ValueChooser({ prop, options, onChange, onManage, close }) {
  const [typed, setTyped] = useState('')
  const isList = Array.isArray(prop.value)
  const current = valueList(prop.value)
  const all = [...new Set([...options, ...current])]
  const query = typed.trim()
  const shown = all.filter(v => v.toLowerCase().includes(query.toLowerCase()))
  const isNew = query && !all.some(v => v.toLowerCase() === query.toLowerCase())

  function choose(value) {
    if (isList) onChange(prop.key, current.includes(value) ? current.filter(v => v !== value) : [...current, value])
    else {
      onChange(prop.key, current.includes(value) ? '' : value)
      close()
    }
    setTyped('')
  }

  return (
    <div className="flex flex-col gap-space-xs">
      <Input
        value={typed}
        placeholder={`Find or add ${prop.key}`}
        onChange={e => setTyped(e.target.value)}
        onKeyDown={e => {
          if (e.key !== 'Enter' || !query) return
          e.preventDefault()
          choose(isNew ? query : (all.find(v => v.toLowerCase() === query.toLowerCase())))
        }}
      />
      <div className="flex max-h-60 flex-col overflow-y-auto">
        {isNew && <ListRow title={`Add “${query}”`} icon={<span className="size-4" />} onClick={() => choose(query)} />}
        {shown.map(v => (
          <ListRow
            key={v} title={v} icon={current.includes(v) ? <Check /> : <span className="size-4" />} onClick={() => choose(v)}
          />
        ))}
        {!isNew && !shown.length && <p className="px-3 py-space-sm text-sm text-muted-foreground">No values yet. Type one to add it.</p>}
      </div>
      {onManage && <>
        <Separator className="-mx-space-sm my-space-xs data-[orientation=horizontal]:w-auto" />
        <ListRow title="Edit values" icon={<PencilSimple />} onClick={onManage} />
      </>}
    </div>
  )
}
