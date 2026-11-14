import { cn } from '@/lib/utils.js'
import { Skeleton } from './ui/skeleton.jsx'

// What a page or widget shows while its content loads: Skeleton shapes like that content, so the screen
// keeps its layout instead of going blank. `kind`: 'list' (rows like ListRow), 'cards' (tiles like CardTile),
// 'text' (a note's lines), 'block' (an image or PDF page). `rows`: how many rows, tiles or lines.
// Custom: shadcn has the Skeleton block but no shapes of our own content. Spinner stays for app start,
// the repo list and pull-to-refresh.
const WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-2/5', 'w-3/5']
const LINES = ['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-2/3']

export default function Loading({ kind = 'list', rows, className }) {
  const n = rows ?? { list: 6, cards: 8, text: 6, block: 1 }[kind]
  const items = Array.from({ length: n }, (_, i) => i)
  return (
    <div role="status" aria-label="Loading" className={cn(kind === 'block' ? 'flex-1 p-space' : kind === 'text' ? 'px-space py-space' : 'p-space', className)}>
      {kind === 'list' && (
        <div className="flex flex-col gap-0.5">
          {items.map(i => (
            <div key={i} className="flex min-h-control items-center gap-3 px-3">
              <Skeleton className="size-4 shrink-0 rounded-sm" />
              <Skeleton className={cn('h-3', WIDTHS[i % WIDTHS.length])} />
            </div>
          ))}
        </div>
      )}
      {kind === 'cards' && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-space-sm">
          {items.map(i => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-lg border border-border px-2 pb-3 pt-space">
              <Skeleton className="size-12 rounded-sm" />
              <Skeleton className="my-1 h-3 w-2/3" />
            </div>
          ))}
        </div>
      )}
      {kind === 'text' && (
        <div className="flex flex-col gap-3">
          <Skeleton className="mb-2 h-6 w-1/2" />
          {items.map(i => <Skeleton key={i} className={cn('h-3', LINES[i % LINES.length])} />)}
        </div>
      )}
      {kind === 'block' && <Skeleton className="mx-auto aspect-[3/4] w-full max-w-2xl rounded-lg" />}
    </div>
  )
}
