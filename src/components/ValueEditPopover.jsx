import { useState } from 'react'
import { PencilSimple } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import ValueEditForm from './ValueEditForm.jsx'

// The pencil beside a value in a property's popover: opens a popover to its right with
// that value's name (editable), its color and a red Remove. `editor`: { color (the value's
// now), others (the property's other values: a name taken by one merges them), count (in
// how many notes), scopeName, onEdit(to, color), onRemove (left out: no Remove) }. Save with
// nothing changed saves nothing (that would pin the automatic color).
export default function ValueEditPopover({ value, editor, own }) {
  const [open, setOpen] = useState(false)
  const { color, others, count, scopeName, onEdit, onRemove } = editor
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="md" aria-label={`Edit ${value}`} tooltip="Edit this value"><PencilSimple /></Button>
      </PopoverTrigger>
      <PopoverContent {...own} data-badge-popover side="right" align="start" sideOffset={20} className="w-72 p-space-sm">
        <div className="flex flex-col gap-space-sm">
          <p className="text-xs text-muted-foreground">Applies to {count} note{count === 1 ? '' : 's'} with it in {scopeName}.</p>
          <ValueEditForm
            value={value}
            others={others}
            color={color}
            onSave={(to, picked) => {
              if (to !== value || picked !== color) onEdit(to, picked)
              setOpen(false)
            }}
            onCancel={() => setOpen(false)}
            onDelete={onRemove && (() => { setOpen(false); onRemove() })}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
