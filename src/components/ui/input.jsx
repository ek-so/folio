import * as React from 'react'
import { cn } from '@/lib/utils'

// Every text field (SearchInput's too) looks the same, wherever it is: a beige fill (`bg-background`), a thin border,
// and on focus a 2px accent edge, all inside it (the border in `border-ring` and a 1px inset ring): nothing around it. Callers give only its place
// (width, flex), never its colors.
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-control w-full rounded-sm border border-border bg-background px-3 py-1 text-base font-normal transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
