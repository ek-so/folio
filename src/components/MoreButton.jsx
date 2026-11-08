import { forwardRef } from 'react'
import { DotsThree } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from '@/components/ui/button.jsx'

// A mouse hides a ⋯ until its row (a group) is hovered or the button has focus or its menu is open; touch always shows it
export const REVEAL = 'pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100 pointer-fine:data-[state=open]:opacity-100'

// The ⋯ button that opens a menu (the trigger of a DropdownMenu, `asChild`), in one of two looks:
// in a title row (the view's, a widget's, an item's) a `ghost-outline` base-size button with a 20px ⋯, or
// `inRow`, inside something that is itself hoverable (a list row, a card, a tray's title) a quiet medium
// one with a 16px ⋯. `reveal`: shown only while its row is hovered (REVEAL). `aria-label` and the rest go on the button.
const MoreButton = forwardRef(function MoreButton({ inRow, reveal, className, ...props }, ref) {
  return (
    <Button
      ref={ref}
      variant={inRow ? 'ghost-quiet' : 'ghost-outline'}
      size={inRow ? 'icon-md' : 'icon'}
      className={cn(reveal && REVEAL, className)}
      {...props}
    >
      <DotsThree weight="bold" size={inRow ? 16 : 20} />
    </Button>
  )
})

export default MoreButton
