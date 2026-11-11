import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Tip } from './tooltip.jsx'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-base font-medium transition-colors [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",

  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-transparent shadow-sm hover:bg-secondary hover:text-secondary-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-secondary hover:text-secondary-foreground',
        // A muted button inside something already tinted or hoverable (a list row, a card, a tray): a faint fill on hover and while its menu is open
        'ghost-quiet': 'text-muted-foreground hover:bg-muted-foreground/10 hover:text-secondary-foreground data-[state=open]:bg-muted-foreground/10',
        // ✓ and ✕ icon buttons: green (success) and red; `*-light` where a ✓ and a ✕ stand together
        success: 'bg-success text-success-foreground shadow-sm hover:bg-success/90',
        'success-light': 'bg-success/15 text-success-ink hover:bg-success/25',
        'destructive-light': 'bg-destructive/15 text-destructive-ink hover:bg-destructive/25',
        // Trash and other destructive icon buttons: red, a light red fill on hover
        'ghost-destructive': 'text-destructive-ink hover:bg-destructive/10',
        'ghost-outline': 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
        link: 'text-primary-ink underline-offset-4 hover:underline',
      },
      size: {
        // Base control (40px, the comfortable tap target); md (32px) and sm (24px) are the medium and small ones. Sizes live in index.css
        default: 'h-control px-4',
        icon: 'size-control shrink-0',
        'icon-md': 'size-control-md shrink-0',
        'icon-sm': 'size-control-sm shrink-0',
        md: 'h-control-md px-2',
        sm: 'h-control-sm gap-1 px-2 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// `tooltip`: shown on hover (ui/tooltip.jsx); the app never uses the browser's `title`
const Button = React.forwardRef(({ className, variant, size, asChild = false, tooltip, tooltipSide, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Tip content={tooltip} side={tooltipSide}>
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    </Tip>
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
