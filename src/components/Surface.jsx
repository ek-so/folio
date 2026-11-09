import { cn } from '@/lib/utils.js'

// The open folder's or file's content: a card-colored box (a rounded, outlined box with 16px gutters (8px on its left, beside the rail: the 8px the two share), on phones under the top bar),
// down to the bottom of the screen. Fills the space; `title` (TitleBar, optional)
// stays on top while the content scrolls inside, in a column of at most 1000px centered in the box (`wide`: at most 1500px, for
// a view's dashboard).
export default function Surface({ title, wide, children }) {
  return (
    <div className="flex flex-1 min-h-0 w-full px-0 pt-0 pb-0 md:pl-space-sm md:pr-space md:pt-space md:pb-[calc(var(--space)+var(--safe-bottom))]">
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden bg-card rounded-xl max-md:rounded-b-none border border-border">
        {title}
        <div className={cn('mx-auto flex min-h-0 w-full flex-1 flex-col', wide ? 'max-w-[1500px]' : 'max-w-[1000px]')}>{children}</div>
      </div>
    </div>
  )
}
