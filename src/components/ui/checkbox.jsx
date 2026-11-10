import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// The app's checkbox mark, drawn like the task checkboxes in the note preview
// (App.css `.editor-preview input[type=checkbox]`): a 16px rounded square,
// outlined, filled with the accent and a white check when `checked`. Only the
// mark: the row it sits in (a ListRow) is what's tapped.
export function Checkbox({ checked, className }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-colors',
        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
        className,
      )}
    >
      {checked && <Check weight="bold" className="size-3" />}
    </span>
  )
}

// The radio mark for one of several choices in a list (the sign-in's repos), drawn like
// `Checkbox`: a 16px circle, outlined, with an accent dot when `checked`. Only the mark:
// the row it sits in is what's tapped.
export function Radio({ checked, className }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px] bg-background transition-colors',
        checked ? 'border-primary' : 'border-border',
        className,
      )}
    >
      {checked && <span className="size-2 rounded-full bg-primary" />}
    </span>
  )
}
