import { DotsThree, PencilSimple, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'

// ⋯ menu of a view in the navigation rail: Rename / Remove. `onRename(view)`
// and `onDelete(view)` open App's dialogs; `disabled` while the views can't
// be changed (not read yet). With a mouse it shows only while the row (`group`) is hovered, focused or its
// menu is open; always on touch. `sub`: it's a sub popover (inside the ☰ menu): opens on the side of its row.
export default function ViewMenu({ view, onRename, onDelete, disabled, sub }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${view.title}`}
          className={cn(
            'size-control-md shrink-0 text-muted-foreground hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10',
            'pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100 pointer-fine:data-[state=open]:opacity-100',
          )}
        >
          <DotsThree weight="bold" size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" {...(sub ? { side: 'right', sideOffset: 8, collisionPadding: 8, className: 'min-w-0' } : {})} onCloseAutoFocus={e => e.preventDefault()}>
        <DropdownMenuItem disabled={disabled} onSelect={() => onRename(view)}><PencilSimple /> Rename</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" disabled={disabled} onSelect={() => onDelete(view)}><X /> Remove</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
