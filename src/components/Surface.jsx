import { cn } from '@/lib/utils.js'
import { NavPanel } from './NavTree.jsx'

// The open folder's or file's content: a card-colored box under Header (a sheet
// edge to edge on phones, lined up with its buttons from 640px; outlined on both),
// down to the bottom of the screen. Fills the space; `title` (TitleBar, optional)
// stays on top while the content scrolls inside, in a column of at most 1000px centered in the box. `tree`: from 768px the file
// tree sits in its own box to the left (on phones it's the title bar's drawer).
export default function Surface({ title, tree, children }) {
  return (
    <div className={cn('flex flex-1 min-h-0 w-full sm:px-2 sm:pt-2 sm:pb-[calc(0.5rem+var(--safe-bottom))]', tree && 'md:gap-2')}>
      {tree && <NavPanel />}
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden bg-card rounded-t-xl border border-border sm:rounded-xl">
        {title}
        <div className="mx-auto flex min-h-0 w-full max-w-[1000px] flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}
