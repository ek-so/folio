import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { PROPERTY_COLORS } from '../lib/frontmatter.js'

// The form that edits one value of a property: its name and its color (`color`: 0 …
// PROPERTY_COLORS - 1, the --tag-N of index.css); `others`: the property's other
// values (a name taken by one merges them). Save calls `onSave(name, color)`, Cancel `onCancel`.
export default function ValueEditForm({ value, others, color, onSave, onCancel }) {
  const [name, setName] = useState(value)
  const [picked, setPicked] = useState(color)
  const trimmed = name.trim()
  const merges = others.includes(trimmed)

  // Arrow keys move between the colors (the picked one is the tab stop)
  function arrow(e) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (picked + step + PROPERTY_COLORS) % PROPERTY_COLORS
    setPicked(next)
    e.currentTarget.children[next].focus()
  }

  function save(e) {
    e.preventDefault()
    if (trimmed) onSave(trimmed, picked)
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <Input value={name} onChange={e => setName(e.target.value)} aria-label="Name" autoCorrect="off" className="bg-background border-border" />
      {merges && <p className="text-sm text-muted-foreground">“{trimmed}” already exists. They become one value.</p>}
      <div role="radiogroup" aria-label="Color" onKeyDown={arrow} className="flex flex-wrap gap-space-sm">
        {Array.from({ length: PROPERTY_COLORS }, (_, i) => (
          <Button
            key={i}
            type="button"
            role="radio"
            aria-checked={picked === i}
            tabIndex={picked === i ? 0 : -1}
            aria-label={`Color ${i + 1}`}
            variant="ghost"
            size="icon"
            style={{ '--tag': `var(--tag-${i})` }}
            className={cn('bg-[var(--tag)] text-primary-foreground hover:bg-[var(--tag)] hover:opacity-80', picked === i && 'ring-2 ring-foreground ring-offset-2 ring-offset-card')}
            onClick={() => setPicked(i)}
          >
            {picked === i && <Check weight="bold" />}
          </Button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!trimmed}>Save</Button>
      </div>
    </form>
  )
}
