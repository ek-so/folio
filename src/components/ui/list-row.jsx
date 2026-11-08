import { cn } from '@/lib/utils'
import { Tip } from './tooltip.jsx'
import { Button } from './button.jsx'

// One row of any list (file manager, folder tree, search, move, backlinks): a
// base-height (40px), rounded row, highlighted on hover or while its ⋯ menu is
// open. The row's own button holds `icon` (left), `title` and an optional
// `description` and does `onClick`. A description is muted: below 1024px a second line under the title (the row grows for it);
// from 1024px it moves to the right, next to `trailing`, in the title's size, at most half the row (cut with …). `leading` sits before that button (the tree's indent and
// chevron), `trailing` after it (⋯, a badge…). `active`: the open or selected item, blue like every selection (`SELECTED`);
// `dimmed`: a hidden file or symlink, its icon and text faded (not the row's
// hover or ⋯); `changed`: the blue dot of local changes after the title;
// `disabled`: can't be opened; `tooltip`: on the whole row (ui/tooltip.jsx).
// `className` and `rowProps` (drag and drop) go on the row itself.
// A selected item (the open page in the rail, the open item in a list): light accent fill, accent text
export const SELECTED = 'bg-primary/15 text-primary-ink hover:bg-primary/20 hover:text-primary-ink'

export function ListRow({ icon, title, description, leading, trailing, onClick, active, dimmed, changed, disabled, tooltip, className, rowProps }) {
  // The tooltip is on the whole row, so it also explains a row that can't be opened
  return (
    <Tip content={tooltip}>
    <div
      {...rowProps}
      className={cn(
        'group flex min-h-control items-center rounded-sm transition-colors hover:bg-secondary/60 has-[[data-state=open]]:bg-secondary/60',
        active && cn(SELECTED, 'has-[[data-state=open]]:bg-primary/20'),
        className,
      )}
    >
      {leading}
      <Button
        variant="ghost"
        className={cn(
          'h-auto min-h-control min-w-0 flex-1 justify-start gap-3 px-3 py-2 font-normal text-left hover:bg-transparent disabled:cursor-default disabled:opacity-100',
          dimmed && 'opacity-50 disabled:opacity-50',
          active && 'text-primary-ink hover:text-primary-ink',
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
          {description && <span className="block truncate text-xs text-muted-foreground lg:hidden">{description}</span>}
        </span>
        {description && <span className="hidden max-w-[50%] shrink-0 truncate text-muted-foreground lg:block">{description}</span>}
      </Button>
      {trailing && <div className="flex shrink-0 items-center pr-1">{trailing}</div>}
    </div>
    </Tip>
  )
}

// The scrolling list of rows in a dialog or popover (Properties, Edit widgets, Edit values): up to 256px tall, then it scrolls,
// reaching 4px past its box so the rows' hover fill lines up with the dialog's padding. Pull to refresh stays off.
export function ListBox({ className, ...props }) {
  return <ul data-no-pull className={cn('-mx-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto', className)} {...props} />
}
