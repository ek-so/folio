import { PencilSimple, Trash } from '@phosphor-icons/react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import MoreButton from './MoreButton.jsx'

// ⋯ menu of a view in the navigation rail: Rename / Remove. `onRename(view)`
// and `onDelete(view)` open App's dialogs; `disabled` while the views can't
// be changed (not read yet). With a mouse it shows only while the row (`group`) is hovered, focused or its
// menu is open; always on touch. In the rail and the phone's ☰ sheet.
export default function ViewMenu({ view, onRename, onDelete, disabled }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MoreButton inRow reveal aria-label={`Actions for ${view.title}`} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onCloseAutoFocus={e => e.preventDefault()}>
        <DropdownMenuItem disabled={disabled} onSelect={() => onRename(view)}><PencilSimple /> Rename</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" disabled={disabled} onSelect={() => onDelete(view)}><Trash /> Remove</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
