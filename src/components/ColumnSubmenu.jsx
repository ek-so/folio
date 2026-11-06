import { Columns, Check } from '@phosphor-icons/react'
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from './ui/dropdown-menu.jsx'

// The "Move to column" submenu of a card's ⋯ and of an open card's file menu (only
// when it's opened from a board, `widgets/index.js` `fileMoves`): the board's shown
// columns, [{ key, name }], the card's own (`column`) ticked and disabled; choosing
// another calls `onSelect(key)`. `children`: more rows at the end (the card's menu adds Edit columns…).
export default function ColumnSubmenu({ columns, column, onSelect, children }) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger><Columns /> Move to column</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {columns.map(c => (
          <DropdownMenuItem key={c.key} disabled={c.key === column} onSelect={() => onSelect(c.key)}>
            {c.key === column ? <Check /> : <span className="size-4" />} {c.name}
          </DropdownMenuItem>
        ))}
        {children}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
