import { cn } from '@/lib/utils'

// A dot that marks something: unsaved changes (accent), new notifications or a reminder come due (red), broken links
// (muted). Custom: shadcn has no dot. Every dot in the app is this one, so they differ only in color and size.
//   size "sm" (6px): beside what it marks, in its line (a file's name, a date's bell)
//   size "md" (8px): on an icon button's top-right corner (`corner`), the button itself `relative`
const TONES = { primary: 'bg-primary', destructive: 'bg-destructive', muted: 'bg-muted-foreground' }
const SIZES = { sm: 'size-1.5', md: 'size-2' }

export function Dot({ tone = 'primary', size = 'sm', corner, className, ...props }) {
  return (
    <span
      // A labelled one is read out (a span's own label isn't, without a role); one without a label is only decoration
      role={props['aria-label'] ? 'img' : undefined}
      aria-hidden={props['aria-label'] ? undefined : true}
      className={cn('inline-block shrink-0 rounded-full', TONES[tone], SIZES[size], corner && 'absolute right-1 top-1', className)}
      {...props}
    />
  )
}
