import { useState } from 'react'
import { FolderOpen, Trash, PencilSimple, X, Check } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { ListRow } from '@/components/ui/list-row.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'

// A sheet of names to tick (a board's columns to show, the properties its cards show):
// `items` in the order listed, `selected` the ticked ones; ticking calls
// `onChange(selected)`, in the order they were ticked. `addLabel` and `onAdd(name)`:
// a field to add a name (returns an error message, or null). At the end of each
// row: `onOpen(item)` a folder button (`openLabel` its label), `onRename(item,
// name)` a pencil that turns the row into a name field (returns an error message,
// or null), `onDelete(item)` a trash button (confirmed by the caller). `empty`:
// the text when there's nothing to list.
export default function CheckListModal({ title, description, items, selected, onChange, addLabel, onAdd, onOpen, openLabel, onRename, onDelete, empty, onClose }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { item, name, error } while a row is renamed

  function saveName(e) {
    e.preventDefault()
    const next = editing.name.trim()
    if (!next || next === editing.item) { setEditing(null); return }
    const err = onRename(editing.item, next)
    if (err) setEditing({ ...editing, error: err })
    else setEditing(null)
  }
  const toggle = item => onChange(selected.includes(item) ? selected.filter(k => k !== item) : [...selected, item])
  const rowButton = 'size-control-md text-muted-foreground hover:bg-muted-foreground/10'

  function addItem(e) {
    e.preventDefault()
    const item = name.trim()
    if (!item) return
    const err = onAdd(item)
    if (err) setError(err)
    else setName('')
  }

  return (
    // Focus goes to the sheet itself, not its first row, so no row opens lit up
    <BottomSheet title={title} description={description} onClose={onClose} onOpenAutoFocus={e => { e.preventDefault(); e.currentTarget?.focus() }}>
      <div className="flex flex-col gap-3">
        <ul className="-mx-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto" data-no-pull>
          {items.map(item => editing?.item === item ? (
            <li key={item}>
              <form onSubmit={saveName} className="flex flex-col gap-1 px-1 py-1">
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={editing.name}
                    onChange={e => setEditing({ ...editing, name: e.target.value, error: '' })}
                    onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setEditing(null) } }}
                    autoCorrect="off"
                    autoCapitalize="none"
                    aria-label={`New name for ${item}`}
                    className="bg-background border-border"
                  />
                  <Button type="submit" variant="ghost" size="icon" aria-label="Save" tooltip="Save" className="shrink-0"><Check /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Cancel" tooltip="Cancel" className="shrink-0" onClick={() => setEditing(null)}><X /></Button>
                </div>
                {editing.error && <p className="text-destructive text-xs">{editing.error}</p>}
              </form>
            </li>
          ) : (
            <li key={item}>
              <ListRow
                icon={<Checkbox checked={selected.includes(item)} />}
                title={item}
                onClick={() => toggle(item)}
                trailing={(onOpen || onRename || onDelete) && <>
                  {onOpen && (
                    <Button variant="ghost" size="icon" aria-label={`${openLabel} ${item}`} tooltip={openLabel} className={rowButton} onClick={() => onOpen(item)}>
                      <FolderOpen />
                    </Button>
                  )}
                  {onRename && (
                    <Button variant="ghost" size="icon" aria-label={`Rename ${item}`} tooltip="Rename" className={rowButton} onClick={() => setEditing({ item, name: item, error: '' })}>
                      <PencilSimple />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost-destructive" size="icon" aria-label={`Delete ${item}`} tooltip="Delete" className="size-control-md" onClick={() => onDelete(item)}>
                      <Trash />
                    </Button>
                  )}
                </>}
              />
            </li>
          ))}
          {!items.length && <p className="py-4 text-center text-sm text-muted-foreground">{empty}</p>}
        </ul>
        {onAdd && (
          <form onSubmit={addItem} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder={addLabel}
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                autoCorrect="off"
                autoCapitalize="none"
                className="bg-background border-border"
              />
              <Button type="submit" variant="secondary" size="icon" aria-label="Add" tooltip="Add" disabled={!name.trim()} className="shrink-0"><Check /></Button>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </form>
        )}
        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </BottomSheet>
  )
}
