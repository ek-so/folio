import { Check, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'

// A list row turned into a field to rename it, with ✓ (`success-light`, submits: `onSubmit(event)`) and ✕ (`destructive-light`,
// `onCancel`; Esc too), and under it `children`: an error or a note. `canSave`: ✓ is on only while it is true.
export default function InlineRename({ value, onChange, onSubmit, onCancel, label, canSave = true, autoCapitalize, children }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-xs p-space-xs">
      <div className="flex items-center gap-space-xs">
        <Input
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onCancel() } }}
          autoCorrect="off"
          autoCapitalize={autoCapitalize}
          aria-label={label}
          className="bg-background border-border"
        />
        <Button type="submit" variant="success-light" size="icon" aria-label="Save" tooltip="Save" disabled={!canSave}><Check /></Button>
        <Button type="button" variant="destructive-light" size="icon" aria-label="Cancel" tooltip="Cancel" onClick={onCancel}><X /></Button>
      </div>
      {children}
    </form>
  )
}
