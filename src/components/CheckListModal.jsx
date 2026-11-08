import { useState } from 'react'
import { FolderOpen, Trash, PencilSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import InlineRename from './InlineRename.jsx'
import { ListRow, ListBox } from '@/components/ui/list-row.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import AddNameField from '@/components/AddNameField.jsx'
import { EmptyMessage } from './EmptyState.jsx'

// A sheet of names to tick (a board's columns to show, the properties its cards show):
// `items` in the order listed (`locked`: names listed first, ticked and not to be changed, like a planner's date or a
// board's status; `lockedDescription`: a muted line under each, why), `selected` the ticked ones; ticking calls
// `onChange(selected)`, in the order they were ticked. `addLabel` and `onAdd(name)`:
// a field to add a name (returns an error message, or null). At the end of each
// row: `onOpen(item)` a folder button (`openLabel` its label), `onRename(item,
// name)` a pencil that turns the row into a name field (returns an error message,
// or null), `onDelete(item)` a trash button (confirmed by the caller). `empty`:
// the text when there's nothing to list. `header`: what sits above the list (a board's Group by).
export default function CheckListModal({ title, description, header, items, locked = [], lockedDescription, selected, onChange, addLabel, onAdd, onOpen, openLabel, onRename, onDelete, empty, onClose }) {
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

  return (
    // Focus goes to the sheet itself, not its first row, so no row opens lit up
    <BottomSheet title={title} description={description} onClose={onClose} onOpenAutoFocus={e => { e.preventDefault(); e.currentTarget?.focus() }}>
      <div className="flex flex-col gap-3">
        {header}
        <ListBox>
          {locked.map(item => (
            <li key={item}>
              <ListRow icon={<Checkbox checked disabled />} title={item} description={lockedDescription} disabled />
            </li>
          ))}
          {items.map(item => editing?.item === item ? (
            <li key={item}>
              <InlineRename
                value={editing.name} onChange={name => setEditing({ ...editing, name, error: '' })}
                onSubmit={saveName} onCancel={() => setEditing(null)}
                label={`New name for ${item}`} autoCapitalize="none"
              >
                {editing.error && <p className="text-destructive-ink text-xs">{editing.error}</p>}
              </InlineRename>
            </li>
          ) : (
            <li key={item}>
              <ListRow
                icon={<Checkbox checked={selected.includes(item)} />}
                title={item}
                onClick={() => toggle(item)}
                trailing={(onOpen || onRename || onDelete) && <>
                  {onOpen && (
                    <Button variant="ghost-quiet" size="icon-md" aria-label={`${openLabel} ${item}`} tooltip={openLabel} onClick={() => onOpen(item)}>
                      <FolderOpen />
                    </Button>
                  )}
                  {onRename && (
                    <Button variant="ghost-quiet" size="icon-md" aria-label={`Rename ${item}`} tooltip="Rename" onClick={() => setEditing({ item, name: item, error: '' })}>
                      <PencilSimple />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost-destructive" size="icon-md" aria-label={`Remove ${item}`} tooltip="Remove" onClick={() => onDelete(item)}>
                      <Trash />
                    </Button>
                  )}
                </>}
              />
            </li>
          ))}
          {!items.length && <EmptyMessage size="sm">{empty}</EmptyMessage>}
        </ListBox>
        {onAdd && <AddNameField label={addLabel} onAdd={onAdd} />}
        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </BottomSheet>
  )
}
