import { cn } from '@/lib/utils'
import { Separator } from './separator.jsx'

// Buttons joined into one control (shadcn/ui ButtonGroup, copied: the CLI would overwrite our button), horizontal only:
// the inner corners square and a single border between outlined buttons (the title bar's Back | Forward); filled buttons
// without a border take a ButtonGroupSeparator between them (the editor's Undo | Redo).
function ButtonGroup({ className, ...props }) {
  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn(
        'flex w-fit shrink-0 items-stretch [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 [&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none',
        className,
      )}
      {...props}
    />
  )
}

// The divider between a group's buttons: a vertical Separator as tall as the group
function ButtonGroupSeparator({ className, ...props }) {
  return <Separator data-slot="button-group-separator" orientation="vertical" className={cn('relative self-stretch data-[orientation=vertical]:h-auto', className)} {...props} />
}

export { ButtonGroup, ButtonGroupSeparator }
