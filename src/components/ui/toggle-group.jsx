import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// The app's toggle groups (shadcn/ui, Radix): one of several choices, with arrow keys moving between them.
// Variants of an item: `segmented` (a segment of a Segmented track: ui/segmented.jsx) `bare` (no look of its
// own: the caller styles it, like a color swatch) and `grid` (one of a grid to pick from, like an emoji). Use `type="single"`; a click on the chosen item doesn't
// deselect it (ignore the empty value in `onValueChange`).
const toggleVariants = cva(
  '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4 inline-flex items-center justify-center gap-2 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        // on: data-state, or aria-checked where a tooltip (Tip) on the item takes over its data-state (icon-only segments)
        segmented: 'h-full min-w-0 flex-1 rounded text-sm text-muted-foreground data-[state=on]:bg-segment-active data-[state=on]:text-foreground data-[state=on]:shadow-sm aria-checked:bg-segment-active aria-checked:text-foreground aria-checked:shadow-sm',
        bare: 'rounded-sm',
        // an item of a grid to pick from (the emoji picker): fills on hover
        grid: 'rounded-sm hover:bg-secondary',
      },
    },
    defaultVariants: { variant: 'bare' },
  },
)

function ToggleGroup({ className, children, ...props }) {
  return (
    <ToggleGroupPrimitive.Root data-slot="toggle-group" className={cn('flex', className)} {...props}>
      {children}
    </ToggleGroupPrimitive.Root>
  )
}

const ToggleGroupItem = React.forwardRef(function ToggleGroupItem({ className, variant, ...props }, ref) {
  return <ToggleGroupPrimitive.Item ref={ref} data-slot="toggle-group-item" className={cn(toggleVariants({ variant }), className)} {...props} />
})

export { ToggleGroup, ToggleGroupItem }
