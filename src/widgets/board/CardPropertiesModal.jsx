import { useState } from 'react'
import { CheckSquare, Square } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { ListRow } from '@/components/ui/list-row.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'

// Which properties a board's cards show (their values, in this order):
// `available` the keys its notes have, `selected` the chosen ones. Choosing
// one, or adding a new name, calls `onChange(keys)`; App gives every note of
// the board the keys it lacks, empty.
export default function CardPropertiesModal({ available, selected, onChange, onClose }) {
  const [name, setName] = useState('')
  const keys = [...selected, ...available.filter(k => !selected.includes(k))]
  const toggle = key => onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key])

  function addKey(e) {
    e.preventDefault()
    const key = name.trim()
    if (!key) return
    if (!selected.includes(key)) onChange([...selected, key])
    setName('')
  }

  return (
    <BottomSheet title="Card properties" description="Their values show on the cards, without names. The description always shows." onClose={onClose}>
      <div className="flex flex-col gap-3">
        <ul className="-mx-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto" data-no-pull>
          {keys.map(key => (
            <li key={key}>
              <ListRow
                icon={selected.includes(key) ? <CheckSquare className="size-5 text-primary" /> : <Square className="size-5 text-muted-foreground" />}
                title={key}
                onClick={() => toggle(key)}
              />
            </li>
          ))}
          {!keys.length && <p className="py-4 text-center text-sm text-muted-foreground">Its notes have no other properties yet.</p>}
        </ul>
        <form onSubmit={addKey} className="flex gap-2">
          <Input
            placeholder="New property"
            value={name}
            onChange={e => setName(e.target.value.replace(/[:\n]/g, ''))}
            autoCorrect="off"
            autoCapitalize="none"
            className="bg-background border-border"
          />
          <Button type="submit" variant="secondary" disabled={!name.trim()}>Add</Button>
        </form>
        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </BottomSheet>
  )
}
