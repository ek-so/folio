import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { ListRow } from './ui/list-row.jsx'
import BottomSheet from './BottomSheet.jsx'
import ValueEditForm from './ValueEditForm.jsx'

// The dialog behind a property popover's pencil: all the values of the property
// `name` (`values`, each with its color in `colors`, a Map), a field to add a new
// one. The rows are plain (a color dot and the name); choosing one replaces the list
// in the same dialog with its form: rename it and pick its color (`onEdit(from, to,
// color)`), or the red Delete (`onRemove(value)`, left out when not given); Cancel or
// Save comes back to the list. `count(value)`: in how many notes; `scopeName`: where.
export default function ValuesModal({ name, values, colors, count, scopeName, onAdd, onEdit, onRemove, onClose }) {
  const [editing, setEditing] = useState(null) // the value being edited
  const [typed, setTyped] = useState('')
  const query = typed.trim()

  function add(e) {
    e.preventDefault()
    if (!query) return
    onAdd(query)
    setTyped('')
  }

  if (editing !== null) {
    const color = colors.get(editing) ?? 0
    const n = count(editing)
    return (
      <BottomSheet
        title={`Edit “${editing}”`}
        description={`Applies to ${n} note${n === 1 ? '' : 's'} with it in ${scopeName}. It changes on GitHub when you sync.`}
        onClose={onClose}
      >
        <ValueEditForm
          value={editing}
          others={values.filter(v => v !== editing)}
          color={color}
          onSave={(next, picked) => {
            // Unchanged: nothing is saved (that would pin the automatic color)
            if (next !== editing || picked !== color) onEdit?.(editing, next, picked)
            setEditing(null)
          }}
          onCancel={() => setEditing(null)}
          onDelete={onRemove && (() => onRemove(editing))}
        />
      </BottomSheet>
    )
  }

  return (
    // Focus goes to the sheet itself, not the field (the keyboard on a phone)
    <BottomSheet title={`Edit ${name}`} onClose={onClose} onOpenAutoFocus={e => { e.preventDefault(); e.currentTarget?.focus() }}>
      <div className="flex flex-col gap-3">
        <form onSubmit={add} className="flex gap-2">
          <Input
            value={typed}
            placeholder={`Add ${name}`}
            onChange={e => setTyped(e.target.value)}
            autoCorrect="off"
            className="bg-background border-border"
          />
          <Button type="submit" variant="secondary" size="icon" aria-label="Add" tooltip="Add" disabled={!query} className="shrink-0"><Check /></Button>
        </form>
        <ul className="-mx-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto" data-no-pull>
          {values.map(v => (
            <li key={v}>
              <ListRow
                icon={<span className="size-3 shrink-0 rounded-full" style={{ background: `var(--tag-${colors.get(v) ?? 0})` }} />}
                title={v}
                onClick={() => setEditing(v)}
              />
            </li>
          ))}
          {!values.length && <p className="py-4 text-center text-sm text-muted-foreground">No values yet. Type one to add it.</p>}
        </ul>
        <div className="flex justify-end"><Button variant="secondary" onClick={onClose}>Done</Button></div>
      </div>
    </BottomSheet>
  )
}
