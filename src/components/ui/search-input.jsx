import { forwardRef, useRef } from 'react'
import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Input } from './input.jsx'
import { Button } from './button.jsx'

// Custom, because shadcn has no search field that clears: every search field (Search, folders, emoji, repos) is
// an `Input` with, while it has text, an accent-colored ✕ inside on the right that empties it (`onChange` gets
// an event whose value is '') and keeps the focus in the field. `className` goes on the field, `wrapperClassName`
// on the box around it (its place in a row). No tooltip on the ✕: the sign-in screens have none (no TooltipProvider).
export const SearchInput = forwardRef(({ value, onChange, className, wrapperClassName, ...props }, ref) => {
  const own = useRef(null)
  const setRef = el => {
    own.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }
  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      <Input ref={setRef} value={value} onChange={onChange} autoCorrect="off" autoCapitalize="none" spellCheck="false" className={cn('pr-control', className)} {...props} />
      {value && (
        <Button
          type="button" variant="ghost" size="icon-md" aria-label="Clear search"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-primary-ink hover:text-primary-ink"
          onClick={() => { onChange({ target: { value: '' } }); own.current?.focus() }}
        >
          <X />
        </Button>
      )}
    </div>
  )
})
SearchInput.displayName = 'SearchInput'
