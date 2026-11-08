import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
import { useOverlayOpen } from '@/hooks/useOverlayOpen.js'
import { useKeepOnScreen } from '@/hooks/useKeepOnScreen.js'

// The app's popovers (shadcn/ui, Radix): a small floating panel next to what
// opened it (shifted onto the screen when it doesn't fit beside it); at least 11rem (`min-w-44`) wide and never taller than
// the room it has: it scrolls inside; closes on an outside click, Esc, or a scroll by touch (useOverlayOpen).
function Popover({ open, defaultOpen, onOpenChange, ...props }) {
  const [isOpen, setOpen] = useOverlayOpen({ open, defaultOpen, onOpenChange })
  return <PopoverPrimitive.Root open={isOpen} onOpenChange={setOpen} {...props} />
}
const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef(function PopoverContent({ className, align = 'start', sideOffset = 6, collisionPadding = 8, ...props }, ref) {
  const keepOnScreen = useKeepOnScreen(ref) // too wide for its side (a phone): overlays what opened it
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={keepOnScreen}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'z-50 w-64 min-w-44 max-w-[calc(100vw-2rem)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-y-contain rounded-sm border border-border bg-popover p-space-sm text-popover-foreground shadow-md outline-none',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})

export { Popover, PopoverTrigger, PopoverContent }
