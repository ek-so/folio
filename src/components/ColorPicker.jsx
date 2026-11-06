import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button.jsx'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import { PROPERTY_COLORS } from '../lib/frontmatter.js'

// A swatch (the color now: 0 … PROPERTY_COLORS - 1, the --tag-N of index.css) that opens a sub
// popover on its side with every color to pick from (`onChange(color)`, then it closes); arrow keys move between them.
// `className`: the swatch button's (medium inside a row)
export default function ColorPicker({ color, onChange, label = 'Color', className }) {
  const [open, setOpen] = useState(false)
  function arrow(e) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (color + step + PROPERTY_COLORS) % PROPERTY_COLORS
    onChange(next)
    e.currentTarget.children[next].focus()
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={label} tooltip="Color" className={cn('shrink-0', className)}>
          <span className="size-4 rounded-full" style={{ background: `var(--tag-${color})` }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} className="w-auto" onClick={e => e.stopPropagation()}>
        <div role="radiogroup" aria-label="Color" onKeyDown={arrow} className="grid grid-cols-5 gap-space-xs">
          {Array.from({ length: PROPERTY_COLORS }, (_, i) => (
            <Button
              key={i}
              type="button"
              role="radio"
              aria-checked={color === i}
              tabIndex={color === i ? 0 : -1}
              aria-label={`Color ${i + 1}`}
              variant="ghost"
              size="icon"
              style={{ '--tag': `var(--tag-${i})` }}
              className={cn('bg-[var(--tag)] text-primary-foreground hover:bg-[var(--tag)] hover:opacity-80', color === i && 'ring-2 ring-foreground ring-offset-2 ring-offset-popover')}
              onClick={() => { onChange(i); setOpen(false) }}
            >
              {color === i && <Check weight="bold" />}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
