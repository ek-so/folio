import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'

// A field under a list in a sheet to add one more by name (a board's column, a view): `label` its placeholder,
// `onAdd(name)` returns an error message, or null (the field empties). The green ✓ adds.
export default function AddNameField({ label, onAdd }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  function add(e) {
    e.preventDefault()
    const item = name.trim()
    if (!item) return
    const err = onAdd(item)
    if (err) setError(err)
    else setName('')
  }
  return (
    <form onSubmit={add} className="flex flex-col gap-space-sm">
      <div className="flex gap-space-sm">
        <Input
          placeholder={label}
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          autoCorrect="off"
          autoCapitalize="none"
          className="bg-background border-border"
        />
        <Button type="submit" variant="success" size="icon" aria-label="Add" tooltip="Add" disabled={!name.trim()} className="shrink-0"><Check /></Button>
      </div>
      {error && <p className="text-destructive-ink text-xs">{error}</p>}
    </form>
  )
}
