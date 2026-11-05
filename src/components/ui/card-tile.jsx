import { cn } from '@/lib/utils'

// One tile of the cards layout (File manager): `icon` large on top, `title` under
// it (up to two lines), `trailing` (⋯) in the top right corner. Takes the same
// props as ListRow (plus `tint`: background classes, light and darker on hover), so a list and its cards show the same things.
// `className` and `tileProps` (drag and drop) go on the tile itself.
export function CardTile({ icon, title, trailing, onClick, tint, dimmed, changed, disabled, tooltip, className, tileProps }) {
  return (
    <div
      {...tileProps}
      className={cn(
        'group relative flex flex-col rounded-sm transition-colors',
        tint,
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={tooltip}
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center gap-2 rounded-sm px-2 pb-3 pt-space text-center text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default',
          dimmed && 'opacity-50',
        )}
      >
        {icon}
        <span className="line-clamp-2 w-full break-words">
          {title}
          {changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
        </span>
      </button>
      {trailing && <div className="absolute right-1 top-1">{trailing}</div>}
    </div>
  )
}
