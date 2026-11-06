import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button.jsx'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group.jsx'
import { PROPERTY_COLORS } from '../lib/frontmatter.js'

// A swatch (the color now: 0 … PROPERTY_COLORS - 1, the --tag-N of index.css) that opens a sub
// popover on its side with every color to pick from (a shadcn ToggleGroup: `onChange(color)`, then it closes; arrow keys move between them).
// `className`: the swatch button's (medium inside a row)
export default function ColorPicker({ color, onChange, label = 'Color', className }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={label} tooltip="Color" className={cn('shrink-0', className)}>
          <span className="size-4 rounded-full" style={{ background: `var(--tag-${color})` }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} className="w-auto" onClick={e => e.stopPropagation()}>
        <ToggleGroup
          type="single"
          value={String(color)}
          onValueChange={v => { if (v) onChange(Number(v)); setOpen(false) }} // the chosen color again just closes it
          role="radiogroup"
          aria-label="Color"
          className="grid grid-cols-5 gap-space-xs"
        >
          {Array.from({ length: PROPERTY_COLORS }, (_, i) => (
            <ToggleGroupItem
              key={i}
              value={String(i)}
              aria-label={`Color ${i + 1}`}
              style={{ '--tag': `var(--tag-${i})` }}
              className={cn('size-control bg-[var(--tag)] text-primary-foreground hover:opacity-80', color === i && 'ring-2 ring-foreground ring-offset-2 ring-offset-popover')}
            >
              {color === i && <Check weight="bold" />}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </PopoverContent>
    </Popover>
  )
}
