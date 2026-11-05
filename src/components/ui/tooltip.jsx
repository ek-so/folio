import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

// The app's tooltips (shadcn/ui, Radix): dark on light (inverted colors),
// text-sm, shown on mouse hover (after `TooltipProvider`'s delay, App) and keyboard
// focus, never on a tap, so nothing essential may depend on one.
const TooltipProvider = ({ delayDuration = 300, ...props }) => <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />

function TooltipContent({ className, sideOffset = 6, ...props }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-80 break-words rounded-sm bg-foreground px-3 py-2 text-sm text-background shadow-md',
          'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}

// `children` (one element that takes a ref) with `content` as its tooltip;
// just `children` when there's no content. Button, ListRow, CardTile and Badge
// take it as their `tooltip` prop.
function Tip({ content, side, children }) {
  if (!content) return children
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </TooltipPrimitive.Root>
  )
}

export { TooltipProvider, TooltipContent, Tip }
