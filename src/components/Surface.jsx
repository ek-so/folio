import { cn } from '@/lib/utils.js'
import { NavPanel } from './NavTree.jsx'

// The open folder's or file's content: a card-colored box (a rounded, outlined box with 16px gutters, on phones under the top bar),
// down to the bottom of the screen. Fills the space; `title` (TitleBar, optional)
// stays on top while the content scrolls inside, in a column of at most 1000px centered in the box (`wide`: the full width, for
// Home's dashboard). `tree`: from 768px the file tree sits in its own box to the left (on phones it's the title bar's drawer).
export default function Surface({ title, tree, wide, children }) {
  return (
    <div className={cn('flex flex-1 min-h-0 w-full px-0 pt-0 pb-0 md:px-space md:pt-space md:pb-[calc(var(--space)+var(--safe-bottom))]', tree && 'md:gap-space')}>
      {tree && <NavPanel />}
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden bg-card rounded-xl max-md:rounded-b-none border border-border">
        {title}
        <div className={cn('mx-auto flex min-h-0 w-full flex-1 flex-col', !wide && 'max-w-[1000px]')}>{children}</div>
      </div>
    </div>
  )
}
