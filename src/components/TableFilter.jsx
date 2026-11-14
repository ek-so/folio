import { FunnelSimple, FunnelSimpleX } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { Checkbox } from './ui/checkbox.jsx'
import { ListBox, ListRow } from './ui/list-row.jsx'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import { Separator } from './ui/separator.jsx'
import { useSingleOpen } from '../hooks/useSingleOpen.jsx'
import { cn, own } from '@/lib/utils.js'

// A table column's filter in the note preview, in its header: a small funnel (as a link badge's ⋯, to fit the line;
// filled and accent-colored while it filters) opening the words the column's cells share (`words`, lib/tableFilter.js),
// each with how many rows use it. Ticking words (`ticked`, their keys) shows only the rows having one of them
// (`onChange(keys)`); Clear filter shows them all again.
export default function TableFilter({ column, words, ticked, onChange }) {
  const [open, setOpen] = useSingleOpen()
  const active = ticked.length > 0
  const toggle = key => onChange(ticked.includes(key) ? ticked.filter(k => k !== key) : [...ticked, key])
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost" size="icon" {...own}
          aria-label={`Filter ${column || 'column'}`} tooltip="Filter"
          className={cn('size-control-sm align-middle', active ? 'text-primary' : 'text-muted-foreground')}
        >
          <FunnelSimple weight={active ? 'fill' : 'regular'} />
        </Button>
      </PopoverTrigger>
      <PopoverContent {...own} onOpenAutoFocus={e => e.preventDefault()} onCloseAutoFocus={e => e.preventDefault()}>
        <ListBox>
          {words.map(w => (
            <li key={w.key}>
              <ListRow
                icon={<Checkbox checked={ticked.includes(w.key)} />}
                title={w.label}
                onClick={() => toggle(w.key)}
                trailing={<span className="px-space-sm text-sm text-muted-foreground">{w.count}</span>}
              />
            </li>
          ))}
        </ListBox>
        {active && <>
          <Separator className="my-space-sm" />
          <Button variant="ghost" className="w-full justify-start" onClick={() => onChange([])}>
            <FunnelSimpleX /> Clear filter
          </Button>
        </>}
      </PopoverContent>
    </Popover>
  )
}
