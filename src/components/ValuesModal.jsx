import { useState } from 'react'
import { Check, PencilSimple, Trash, X } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { ListRow } from './ui/list-row.jsx'
import BottomSheet from './BottomSheet.jsx'
import ColorPicker from './ColorPicker.jsx'

// The dialog behind a property popover's Edit values: every value of the property `name`
// (`values`, each with its color in `colors`, a Map) in one list, a field to add a new one
// (`onAdd(value)`), and on the right of each row its color swatch, a pencil and a red trash
// (`onRemove(value)`). The swatch opens a sub popover with the colors (`ColorPicker`): choosing one recolors that
// value at once (`onEdit(from, to, color)` with the same name). The pencil turns the row into a field for
// its name (the swatch and the trash stay on it): Save (✓) renames that value, keeping its color, everywhere in the same scope
// (`scopeName`; `count(value)`: in how many notes); a name another value has merges them. Save with
// nothing changed saves nothing.
export default function ValuesModal({ name, values, colors, count, scopeName, onAdd, onEdit, onRemove, onClose }) {
  const [editing, setEditing] = useState(null) // { value, name } while a row is edited
  const [typed, setTyped] = useState('')
  const query = typed.trim()

  function add(e) {
    e.preventDefault()
    if (!query) return
    onAdd(query)
    setTyped('')
  }

  function save(e) {
    e.preventDefault()
    const next = editing.name.trim()
    if (!next) return
    if (next !== editing.value) onEdit(editing.value, next, colors.get(editing.value) ?? 0)
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
        <ul className="-mx-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto" data-no-pull>
          {values.map(v => editing?.value === v ? (
            <li key={v}>
              <form onSubmit={save} className="flex flex-col gap-1 px-1 py-1">
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={editing.name}
                    onChange={e => setEditing({ ...editing, name: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setEditing(null) } }}
                    autoCorrect="off"
                    aria-label={`New name for ${v}`}
                    className="bg-background border-border"
                  />
                  {onEdit && <ColorPicker label={`Color of ${v}`} color={colors.get(v) ?? 0} onChange={color => onEdit(v, v, color)} />}
                  <Button type="submit" variant="success-light" size="icon" aria-label="Save" tooltip="Save" disabled={!editing.name.trim()} className="shrink-0"><Check /></Button>
                  <Button type="button" variant="destructive-light" size="icon" aria-label="Cancel" tooltip="Cancel" className="shrink-0" onClick={() => setEditing(null)}><X /></Button>
                  {onRemove && <Button type="button" variant="ghost-destructive" size="icon" aria-label={`Remove ${v}`} tooltip="Remove" className="shrink-0" onClick={() => onRemove(v)}><Trash /></Button>}
                </div>
                <p className="px-1 text-xs text-muted-foreground">
                  {values.some(o => o !== v && o === editing.name.trim()) ? `“${editing.name.trim()}” already exists. They become one value. ` : ''}
                  {count(v)} note{count(v) === 1 ? '' : 's'} with it in {scopeName}.
                </p>
              </form>
            </li>
          ) : (
            <li key={v}>
              <ListRow
                disabled
                title={v}
                trailing={<>
                  {onEdit && <ColorPicker label={`Color of ${v}`} color={colors.get(v) ?? 0} onChange={color => onEdit(v, v, color)} />}
                  {onEdit && <Button variant="ghost" size="icon" aria-label={`Edit ${v}`} tooltip="Edit" onClick={() => setEditing({ value: v, name: v })}><PencilSimple /></Button>}
                  {onRemove && <Button variant="ghost-destructive" size="icon" aria-label={`Remove ${v}`} tooltip="Remove" onClick={() => onRemove(v)}><Trash /></Button>}
                </>}
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
