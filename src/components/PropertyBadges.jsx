import { useEffect, useState } from 'react'
import { CaretDown, Check, Trash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Badge } from './ui/badge.jsx'
import { Input } from './ui/input.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import { Button } from './ui/button.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import { valueList, valueColors, DESCRIPTION } from '../lib/frontmatter.js'
import { inlineHtml } from '../lib/previewLinks.js'

// A click or press inside a badge or its popover is the property's, never the
// note's or the card's (open it, start a drag, double tap to edit): React
// events pass through portals to the parent
const own = { onClick: e => e.stopPropagation(), onMouseDown: e => e.stopPropagation(), onTouchStart: e => e.stopPropagation() }

// A badge's color: its value's hue within its property (--tag-N, index.css), grey when empty; tinted against the card, a bit stronger on hover
const tint = color => ({
  style: { '--tag': color === undefined ? 'var(--muted-foreground)' : `var(--tag-${color})` },
  className: 'bg-[color-mix(in_oklab,var(--tag)_var(--tag-tint),var(--card))]',
})
const TINT_HOVER = 'hover:bg-[color-mix(in_oklab,var(--tag)_calc(var(--tag-tint)_*_1.7),var(--card))]'

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
// With `onRemoveValue(key, value)` each value in the popover has a 🗑 that asks first, then
// empties that value everywhere it's used (`valueCount(key, value)`: in how many notes;
// `scopeName`: where, "this folder").
export default function PropertyBadges({ props, path, files, clamp, title, className, onChange, options, onRemoveValue, valueCount, scopeName }) {
  const [removing, setRemoving] = useState(null) // { key, value } being confirmed
  const parts = [] // [{ text }] or [{ badges: [{ id, prop, label }] }], in order
  for (const prop of props) {
    const values = valueList(prop.value)
    if (prop.key === DESCRIPTION) { if (values.length) parts.push({ text: values.join(', ') }); continue }
    if (!values.length && !onChange) continue
    if (!parts.at(-1)?.badges) parts.push({ badges: [] })
    const labels = values.length ? values : [null]
    parts.at(-1).badges.push(...labels.map((label, i) => ({ id: `${prop.key}:${i}`, prop, label })))
  }
  if (!parts.length) return null
  // Each property's values (all it can have, so none shares a color with another)
  const colors = Object.fromEntries([...new Set(props.map(p => p.key))].map(key =>
    [key, valueColors(key, [...(options?.(key) ?? []), ...valueList(props.find(p => p.key === key).value)])]))
  const body = parts.map((part, i) => part.text
    ? <p
        key={i}
        className={cn('md-inline break-words text-sm text-muted-foreground', clamp && 'line-clamp-3')}
        dangerouslySetInnerHTML={{ __html: inlineHtml(part.text, path, files) }}
      />
    : (
      <div key={i} className="flex flex-wrap gap-space-xs">
        {part.badges.map(({ id, prop, label }) => onChange
          ? <EditableBadge key={id} prop={prop} label={label} color={colors[prop.key].get(label)} options={options} onChange={onChange} onRemove={onRemoveValue && (value => setRemoving({ key: prop.key, value }))} />
          : (
            <Badge key={id} {...tint(colors[prop.key].get(label))}><span className="truncate">{label}</span></Badge>
          ))}
      </div>
    ))
  // The confirmation is in a `contents` div so a click in it, like one in a popover, stays its own
  const confirm = removing && (
    <div className="contents" {...own}>
      <ConfirmModal
        title={`Delete “${removing.value}” from ${removing.key}?`}
        description={`It becomes empty in ${valueCount(removing.key, removing.value)} note${valueCount(removing.key, removing.value) === 1 ? '' : 's'} in ${scopeName}. It changes on GitHub when you sync.`}
        onConfirm={() => { onRemoveValue(removing.key, removing.value); setRemoving(null) }}
        onClose={() => setRemoving(null)}
      />
    </div>
  )
  if (!title) return <div className={cn('flex flex-col gap-space-sm', className)}>{body}{confirm}</div>
  return (
    <div className={className}>
      <section className="flex flex-col gap-space-sm rounded-lg bg-secondary/50 p-space-sm">
        <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
        {body}
      </section>
      {confirm}
    </div>
  )
}

// The `setOpen` of the badge whose popover is open, if any
let closeOpenPopover = null

// One value of a property as a badge with a ▾ that opens the property's popover
// (`label` null: the property is empty and shows its name)
function EditableBadge({ prop, label, color, options, onChange, onRemove }) {
  const [open, setOpenState] = useState(false)
  // Only one popover is open at a time, across every badge and card: opening one closes the open one
  function setOpen(next) {
    if (next) {
      if (closeOpenPopover && closeOpenPopover !== setOpenState) closeOpenPopover(false)
      closeOpenPopover = setOpenState
    } else if (closeOpenPopover === setOpenState) closeOpenPopover = null
    setOpenState(next)
  }
  useEffect(() => () => { if (closeOpenPopover === setOpenState) closeOpenPopover = null }, [])
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge
          as="button"
          type="button"
          style={tint(color).style}
          className={cn('cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring', tint(color).className, TINT_HOVER, label === null && 'text-muted-foreground')}
          {...own}
        >
          <span className="truncate">{label ?? prop.key}</span>
          <CaretDown className="size-3 shrink-0" />
        </Badge>
      </PopoverTrigger>
      {/* Opening it doesn't focus the field (the keyboard on a phone): the panel takes the focus, a tap or Tab reaches the field */}
      <PopoverContent {...own} tabIndex={-1} onOpenAutoFocus={e => { e.preventDefault(); e.currentTarget.focus() }}>
        <ValueChooser prop={prop} options={options?.(prop.key) ?? []} onChange={onChange} onRemove={onRemove && (value => { setOpen(false); onRemove(value) })} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

// The values to choose from (what other notes nearby have, plus what this one
// has), a field to type a new one. A property with a list of values toggles them
// and stays open; one with a single value takes the chosen one (choosing it
// again empties it) and closes.
function ValueChooser({ prop, options, onChange, onRemove, close }) {
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
            trailing={onRemove && <Button variant="ghost" size="md" aria-label={`Delete ${v}`} tooltip="Delete this value" onClick={() => onRemove(v)}><Trash /></Button>}
          />
        ))}
        {!isNew && !shown.length && <p className="px-3 py-2 text-sm text-muted-foreground">No values yet. Type one to add it.</p>}
      </div>
      <Button onClick={close}>Done</Button>
    </div>
  )
}
