import * as React from 'react'
import { cn } from '@/lib/utils'

// A small pill-shaped label (a note's property, a date, a planner card's repeat, a link in the preview, symlinks
// pointing at a file); long text is cut. Takes a ref, so it can carry a tooltip (Tip); `as="button"` for one that opens something.
// Every colored badge is this one: `tone` (a color: `var(--tag-3)` for a value, `var(--destructive)` for a late date,
// `var(--primary)` for a repeat) tints it against the card (--tag-tint) and gives its text and icons the same hue mixed
// toward the text color (--ink), like all colored text. Without a tone it's grey. `hoverable`: a bit stronger on hover.
export const Badge = React.forwardRef(function Badge({ as: Tag = 'span', tone, hoverable, className, style, children, ...props }, ref) {
  return (
    <Tag
      ref={ref}
      style={tone ? { '--tone': tone, ...style } : style}
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-sm',
        tone
          ? cn('bg-[color-mix(in_oklab,var(--tone)_var(--tag-tint),var(--card))] text-[color:color-mix(in_oklab,var(--tone)_var(--ink),var(--foreground))]',
              hoverable && 'hover:bg-[color-mix(in_oklab,var(--tone)_calc(var(--tag-tint)_*_1.7),var(--card))]')
          : cn('bg-secondary text-secondary-foreground', hoverable && 'hover:bg-muted-foreground/15'),
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
})
