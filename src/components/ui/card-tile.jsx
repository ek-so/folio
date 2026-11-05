import { cn } from '@/lib/utils'
import { Tip } from './tooltip.jsx'

// One tile of the cards layout (File manager): `icon` large on top, `title` under
// it (`tall`: two lines tall even for a short name, so tiles are the same height; File manager
// sets it when any name in the folder wraps), `trailing` (⋯) in the top right corner. Takes the same
// props as ListRow (plus `tint`: background classes of the square behind the icon), so a list and its cards show the same things.
// `className` and `tileProps` (drag and drop) go on the tile itself.
export function CardTile({ icon, title, trailing, onClick, tint, tall, dimmed, changed, disabled, tooltip, className, tileProps }) {
  // The tooltip is on the whole row, so it also explains a row that can't be opened
  return (
    <Tip content={tooltip}>
    <div
      {...tileProps}
      className={cn(
        'group relative flex flex-col rounded-lg border border-border transition-colors hover:bg-secondary/60 has-[[data-state=open]]:bg-secondary/60',
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center gap-2 rounded-sm px-2 pb-3 pt-space text-center text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default',
          dimmed && 'opacity-50',
        )}
      >
        <span className={cn('flex size-12 items-center justify-center rounded-sm transition-colors', tint)}>{icon}</span>
        <span className={cn('line-clamp-2 w-full break-words', tall && 'min-h-[2lh]')}>
          <span data-card-label>
            {title}
            {changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
          </span>
        </span>
      </button>
      {trailing && <div className="absolute right-1 top-1">{trailing}</div>}
    </div>
    </Tip>
  )
}
