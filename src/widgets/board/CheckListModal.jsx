import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { ListRow } from '@/components/ui/list-row.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'

// A sheet of names to tick (a board's columns to show, the properties its cards show):
// `items` in the order listed, `selected` the ticked ones; ticking calls
// `onChange(selected)`, in the order they were ticked. `addLabel`: a field to
// add a name that isn't listed yet (ticked); `empty`: the text when there's nothing to list.
export default function CheckListModal({ title, description, items, selected, onChange, addLabel, empty, onClose }) {
  const [name, setName] = useState('')
  const toggle = item => onChange(selected.includes(item) ? selected.filter(k => k !== item) : [...selected, item])

  function addItem(e) {
    e.preventDefault()
    const item = name.trim()
    if (!item) return
    if (!selected.includes(item)) onChange([...selected, item])
    setName('')
  }

  return (
    <BottomSheet title={title} description={description} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <ul className="-mx-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto" data-no-pull>
          {items.map(item => (
            <li key={item} role="checkbox" aria-checked={selected.includes(item)}>
              <ListRow
                icon={<Checkbox checked={selected.includes(item)} />}
                title={item}
                onClick={() => toggle(item)}
              />
            </li>
          ))}
          {!items.length && <p className="py-4 text-center text-sm text-muted-foreground">{empty}</p>}
        </ul>
        {addLabel && (
          <form onSubmit={addItem} className="flex gap-2">
            <Input
              placeholder={addLabel}
              value={name}
              onChange={e => setName(e.target.value.replace(/[:\n]/g, ''))}
              autoCorrect="off"
              autoCapitalize="none"
              className="bg-background border-border"
            />
            <Button type="submit" variant="secondary" disabled={!name.trim()}>Add</Button>
          </form>
        )}
        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </BottomSheet>
  )
}
