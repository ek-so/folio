import { cn } from '@/lib/utils.js'

// A section's small muted title in a list or sheet ("Views" in the menu, "Time" and "Reminder" in the date sheet), as
// tall as a row, with what acts on the section on its right (`trailing`: a ⋯, a trash). Custom: shadcn has no section
// heading. `hidden`: the title only for screen readers (the collapsed rail), `trailing` centered
export function SectionTitle({ children, trailing, hidden, className }) {
  return (
    <div className={cn('flex min-h-control items-center gap-space-sm', hidden ? 'justify-center' : 'pl-3 pr-1', className)}>
      <h2 className={hidden ? 'sr-only' : 'min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground'}>{children}</h2>
      {trailing}
    </div>
  )
}
