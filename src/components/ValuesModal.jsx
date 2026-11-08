import { useState } from 'react'
import { Check, PencilSimple, Trash } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { ListRow, ListBox } from './ui/list-row.jsx'
import InlineRename from './InlineRename.jsx'
import BottomSheet from './BottomSheet.jsx'
import ColorPicker from './ColorPicker.jsx'
import { plural } from '../lib/plural.js'
import { EmptyMessage } from './EmptyState.jsx'

// The dialog behind a property popover's Edit values: every value of the property `name`
// (`values`, each with its color in `colors`, a Map) in one list, a field to add a new one
// (`onAdd(value)`), and on the right of each row its color swatch, a pencil and a red trash
// (`onRemove(value)`). The swatch opens a sub popover with the colors (`ColorPicker`): choosing one recolors that
// value at once (`onEdit(from, to, color)` with the same name). The pencil turns the row into a field for
// its name (only ✓ and ✕ show on it until you accept or dismiss): Save (✓) renames that value, keeping its color, everywhere in the same scope
// (`scopeName`; `count(value)`: in how many notes); a name another value has merges them, in that one's color.
// `replaces`: the value Add replaces on this note (a single-value property), said under the field. Save with
// nothing changed saves nothing.
export default function ValuesModal({ name, values, colors, count, scopeName, replaces, onAdd, onEdit, onRemove, onClose }) {
  const [editing, setEditing] = useState(null) // { value, name } while a row is edited
  const [typed, setTyped] = useState('')
  const query = typed.trim()

  function add(e) {
    e.preventDefault()
    if (!query) return
    onAdd(values.find(v => v.toLowerCase() === query.toLowerCase()) ?? query) // a value that exists is chosen as it's written
    setTyped('')
  }

  function save(e) {
    e.preventDefault()
    const next = editing.name.trim()
    if (!next) return
    // Merged into another value: that one keeps its color
    const kept = values.includes(next) ? next : editing.value
    if (next !== editing.value) onEdit(editing.value, next, colors.get(kept) ?? 0)
    setEditing(null)
  }

  return (
    // Focus goes to the sheet itself, not the field (the keyboard on a phone)
    <BottomSheet
      title={`Edit ${name}`}
      description={`Renaming or recoloring a value applies to every note that has it in ${scopeName}.`}
      onClose={onClose}
      onOpenAutoFocus={e => { e.preventDefault(); e.currentTarget?.focus() }}
    >
      <div className="flex flex-col gap-3">
        <form onSubmit={add} className="flex gap-2">
          <Input
            value={typed}
            placeholder={`Add ${name}`}
            onChange={e => setTyped(e.target.value)}
            autoCorrect="off"
            className="bg-background border-border"
          />
          <Button type="submit" variant="success" size="icon" aria-label="Add" tooltip="Add" disabled={!query} className="shrink-0"><Check /></Button>
        </form>
        {replaces && query && query !== replaces && <p className="-mt-1 px-1 text-xs text-muted-foreground">Adding it replaces “{replaces}” on this note.</p>}
        <ListBox>
          {values.map(v => editing?.value === v ? (
            <li key={v}>
              <InlineRename
                value={editing.name} onChange={name => setEditing({ ...editing, name })}
                onSubmit={save} onCancel={() => setEditing(null)}
                label={`New name for ${v}`} canSave={!!editing.name.trim()}
              >
                <p className="px-space-xs text-xs text-muted-foreground">
                  {values.some(o => o !== v && o === editing.name.trim()) ? `“${editing.name.trim()}” already exists. They become one value. ` : ''}
                  {plural(count(v), 'note')} with it in {scopeName}.
                </p>
              </InlineRename>
            </li>
          ) : (
            <li key={v}>
              <ListRow
                disabled
                title={v}
                trailing={<>
                  {onEdit && <ColorPicker label={`Color of ${v}`} color={colors.get(v) ?? 0} onChange={color => onEdit(v, v, color)} className="size-control-md" />}
                  {onEdit && <Button variant="ghost-quiet" size="icon-md" aria-label={`Edit ${v}`} tooltip="Edit" onClick={() => setEditing({ value: v, name: v })}><PencilSimple /></Button>}
                  {onRemove && <Button variant="ghost-destructive" size="icon-md" aria-label={`Remove ${v}`} tooltip="Remove" onClick={() => onRemove(v)}><Trash /></Button>}
                </>}
              />
            </li>
          ))}
          {!values.length && <EmptyMessage size="sm">No values yet. Type one to add it.</EmptyMessage>}
        </ListBox>
        <div className="flex justify-end"><Button variant="secondary" onClick={onClose}>Done</Button></div>
      </div>
    </BottomSheet>
  )
}
