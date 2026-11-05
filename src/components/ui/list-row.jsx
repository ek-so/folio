import { cn } from '@/lib/utils'
import { Tip } from './tooltip.jsx'
import { Button } from './button.jsx'

// One row of any list (file manager, file tree, search, move, backlinks): a
// base-height (40px), rounded row, highlighted on hover or while its ⋯ menu is
// open. The row's own button holds `icon` (left), `title` and an optional
// `description` (a second, muted line; the row grows for it) and does
// `onClick`. `leading` sits before that button (the tree's indent and
// chevron), `trailing` after it (⋯, a badge…). `active`: the open item;
// `dimmed`: a hidden file or symlink, its icon and text faded (not the row's
// hover or ⋯); `changed`: the blue dot of local changes after the title;
// `disabled`: can't be opened; `tooltip`: on the whole row (ui/tooltip.jsx).
// `className` and `rowProps` (drag and drop) go on the row itself.
export function ListRow({ icon, title, description, leading, trailing, onClick, active, dimmed, changed, disabled, tooltip, className, rowProps }) {
  // The tooltip is on the whole row, so it also explains a row that can't be opened
  return (
    <Tip content={tooltip}>
    <div
      {...rowProps}
      className={cn(
        'group flex min-h-control items-center rounded-sm transition-colors hover:bg-secondary/60 has-[[data-state=open]]:bg-secondary/60',
        active && 'bg-secondary hover:bg-secondary',
        className,
      )}
    >
      {leading}
      <Button
        variant="ghost"
        className={cn(
          'h-auto min-h-control min-w-0 flex-1 justify-start gap-3 px-3 py-2 font-normal text-left hover:bg-transparent disabled:cursor-default disabled:opacity-100',
          dimmed && 'opacity-50 disabled:opacity-50',
        )}
        onClick={onClick}
        disabled={disabled}
      >
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block truncate">
            {title}
            {changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
          </span>
          {description && <span className="block truncate text-xs text-muted-foreground">{description}</span>}
        </span>
      </Button>
      {trailing && <div className="flex shrink-0 items-center pr-1">{trailing}</div>}
    </div>
    </Tip>
  )
}
