import { useState } from 'react'
import { TextT, Hash, TagSimple, ListBullets, CalendarBlank, CheckSquare, LinkSimple, SortAscending, SortDescending, FunnelSimple, FunnelSimpleX, CaretRight, Check, MagicWand } from '@phosphor-icons/react'
import { EmptyMessage, EMPTY } from './EmptyState.jsx'
import { Button } from './ui/button.jsx'
import { Checkbox } from './ui/checkbox.jsx'
import { Input } from './ui/input.jsx'
import { Label } from './ui/label.jsx'
import { ListBox, ListRow } from './ui/list-row.jsx'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import { Segmented } from './ui/segmented.jsx'
import { Separator } from './ui/separator.jsx'
import { useSingleOpen } from '../hooks/useSingleOpen.jsx'
import { COLUMN_TYPES, SORT_LABELS, typeLabel, isFiltering } from '../lib/tables.js'
import { cn, own } from '@/lib/utils.js'

export const TYPE_ICONS = { text: TextT, number: Hash, select: TagSimple, multi: ListBullets, date: CalendarBlank, checkbox: CheckSquare, link: LinkSimple }

// A table column's menu in the note preview, in its header (MarkdownPreview): a small button (as a link badge's ⋯, to
// fit the line) showing the column's type icon, or, accent-colored, its sort arrow or a filled funnel while it sorts or
// filters. It opens: Type (a sub popover: Automatic, what the cells look like, then every type; `onType(type | null)`,
// none while the types can't be saved), Sort (`sort` 'asc' | 'desc' | null for Manual, the note's order; `onSort`), and the type's filter (`filter`,
// `onFilter(filter | null)`, lib/tables.js `cellPasses`): a select's or multi-select's values to tick (`values`:
// [{ value, count }]), a number's Min and Max, a date's From and To, a checkbox's All / Not done / Done; text and links
// only sort. Clear filter shows every row again.
export default function TableColumn({ name, type, detected, picked, onType, sort, onSort, filter, onFilter, values }) {
  const [open, setOpen] = useSingleOpen()
  const filtering = isFiltering(filter)
  const Icon = filtering ? FunnelSimple : sort === 'asc' ? SortAscending : sort === 'desc' ? SortDescending : TYPE_ICONS[type]
  const [asc, desc] = SORT_LABELS[type]
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost" size="icon" {...own}
          aria-label={`${name || 'Column'}: ${typeLabel(type)}, sort and filter`} tooltip="Type, sort and filter"
          className={cn('size-control-sm align-middle', filtering || sort ? 'text-primary' : 'text-muted-foreground')}
        >
          <Icon weight={filtering ? 'fill' : 'regular'} />
        </Button>
      </PopoverTrigger>
      <PopoverContent {...own} className="flex w-72 flex-col gap-space-sm" onOpenAutoFocus={e => e.preventDefault()} onCloseAutoFocus={e => e.preventDefault()}>
        <TypePicker type={type} detected={detected} picked={picked} onType={onType} />
        <Separator />
        <Label>Sort</Label>
        <Segmented stretch label="Sort" value={sort ?? 'none'} onChange={v => onSort(v === 'none' ? null : v)}
          options={[['none', 'Manual'], ['asc', asc, SortAscending], ['desc', desc, SortDescending]]} />
        {type !== 'text' && type !== 'link' && <>
          <Separator />
          <Label>Filter</Label>
          <Filter type={type} filter={filter} onFilter={onFilter} values={values} />
          {filtering && (
            <Button variant="ghost" className="w-full justify-start" onClick={() => onFilter(null)}>
              <FunnelSimpleX /> Clear filter
            </Button>
          )}
        </>}
      </PopoverContent>
    </Popover>
  )
}

// Type, opening a sub popover on its side with Automatic and every type, the column's ticked
function TypePicker({ type, detected, picked, onType }) {
  const [open, setOpen] = useState(false)
  const Icon = TYPE_ICONS[type]
  const choose = t => { onType(t); setOpen(false) }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-full justify-start font-normal" disabled={!onType}>
          <Icon /> Type <span className="ml-auto text-muted-foreground">{typeLabel(type)}</span> <CaretRight className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} {...own}>
        <ListBox>
          <li>
            <ListRow icon={<MagicWand />} title="Automatic" description={typeLabel(detected)} onClick={() => choose(null)}
              trailing={!picked && <Check className="mr-space-sm text-primary" />} />
          </li>
          {COLUMN_TYPES.map(([t, label]) => {
            const TypeIcon = TYPE_ICONS[t]
            return (
              <li key={t}>
                <ListRow icon={<TypeIcon />} title={label} onClick={() => choose(t)} trailing={picked === t && <Check className="mr-space-sm text-primary" />} />
              </li>
            )
          })}
        </ListBox>
      </PopoverContent>
    </Popover>
  )
}

const dayValue = d => d ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : ''
const dayOf = v => { const [year, month, day] = v.split('-').map(Number); return v ? { year, month, day } : null }

function Filter({ type, filter, onFilter, values }) {
  if (type === 'select' || type === 'multi') {
    const ticked = filter?.values ?? []
    const toggle = v => onFilter({ values: ticked.includes(v) ? ticked.filter(x => x !== v) : [...ticked, v] })
    if (!values.length) return <EmptyMessage size="sm" emoji={EMPTY.values}>No values yet.</EmptyMessage>
    return (
      <ListBox>
        {values.map(({ value, count }) => (
          <li key={value}>
            <ListRow icon={<Checkbox checked={ticked.includes(value)} />} title={value} onClick={() => toggle(value)}
              trailing={<span className="px-space-sm text-sm text-muted-foreground">{count}</span>} />
          </li>
        ))}
      </ListBox>
    )
  }
  if (type === 'checkbox') {
    return <Segmented stretch label="Show" value={filter ?? 'all'} onChange={v => onFilter(v === 'all' ? null : v)}
      options={[['all', 'All'], ['open', 'Not done'], ['done', 'Done']]} />
  }
  const [from, to, read, write, kind] = type === 'number'
    ? ['min', 'max', v => v ?? '', v => v, 'number']
    : ['from', 'to', dayValue, dayOf, 'date']
  return (
    <div className="grid grid-cols-2 gap-space-sm">
      {[[from, type === 'number' ? 'Min' : 'From'], [to, type === 'number' ? 'Max' : 'To']].map(([key, label]) => (
        <Label key={key} className="flex flex-col items-stretch gap-space-xs">
          {label}
          <Input type={kind} inputMode={kind === 'number' ? 'decimal' : undefined} value={read(filter?.[key])}
            onChange={e => onFilter({ ...filter, [key]: write(e.target.value) })} />
        </Label>
      ))}
    </div>
  )
}
