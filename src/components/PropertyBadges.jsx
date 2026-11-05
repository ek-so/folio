import { useState } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Badge } from './ui/badge.jsx'
import { Input } from './ui/input.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import { Tip } from './ui/tooltip.jsx'
import { valueList, DESCRIPTION } from '../lib/frontmatter.js'
import { inlineHtml } from '../lib/previewLinks.js'

// A click or press inside a badge or its popover is the property's, never the
// note's or the card's (open it, start a drag, double tap to edit): React
// events pass through portals to the parent
const own = { onClick: e => e.stopPropagation(), onMouseDown: e => e.stopPropagation(), onTouchStart: e => e.stopPropagation() }

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
export default function PropertyBadges({ props, path, files, clamp, title, className, onChange, options }) {
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
  const body = parts.map((part, i) => part.text
    ? <p
        key={i}
        className={cn('md-inline break-words text-sm text-muted-foreground', clamp && 'line-clamp-3')}
        dangerouslySetInnerHTML={{ __html: inlineHtml(part.text, path, files) }}
      />
    : (
      <div key={i} className="flex flex-wrap gap-space-xs">
        {part.badges.map(({ id, prop, label }) => onChange
          ? <EditableBadge key={id} prop={prop} label={label} card={!!title} options={options} onChange={onChange} />
          : (
            <Tip key={id} content={`${prop.key}: ${label}`}>
              <Badge className={cn(title && 'bg-card')}><span className="truncate">{label}</span></Badge>
            </Tip>
          ))}
      </div>
    ))
  if (!title) return <div className={cn('flex flex-col gap-space-sm', className)}>{body}</div>
  return (
    <div className={className}>
      <section className="flex flex-col gap-space-sm rounded-lg bg-secondary/50 p-space-sm">
        <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
        {body}
      </section>
    </div>
  )
}

// One value of a property as a badge with a ▾ that opens the property's popover
// (`label` null: the property is empty and shows its name)
function EditableBadge({ prop, label, card, options, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tip content={label === null ? undefined : `${prop.key}: ${label}`}>
        <PopoverTrigger asChild>
          <Badge
            as="button"
            type="button"
            className={cn('cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring', card ? 'bg-card hover:bg-secondary' : 'hover:bg-secondary/70', label === null && 'text-muted-foreground')}
            {...own}
          >
            <span className="truncate">{label ?? prop.key}</span>
            <CaretDown className="size-3 shrink-0" />
          </Badge>
        </PopoverTrigger>
      </Tip>
      <PopoverContent {...own}>
        <ValueChooser prop={prop} options={options?.(prop.key) ?? []} onChange={onChange} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

// The values to choose from (what other notes nearby have, plus what this one
// has), a field to type a new one. A property with a list of values toggles them
// and stays open; one with a single value takes the chosen one (choosing it
// again empties it) and closes.
function ValueChooser({ prop, options, onChange, close }) {
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
        autoFocus
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
          <ListRow key={v} title={v} icon={current.includes(v) ? <Check /> : <span className="size-4" />} onClick={() => choose(v)} />
        ))}
        {!isNew && !shown.length && <p className="px-3 py-2 text-sm text-muted-foreground">No values yet. Type one to add it.</p>}
      </div>
    </div>
  )
}
