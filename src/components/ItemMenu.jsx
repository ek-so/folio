import { useState } from 'react'
import { DotsThree, PencilSimple, Trash, Folder, Rows, SquaresFour } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu.jsx'
import { Segmented } from './ui/segmented.jsx'
import RenameModal from './RenameModal.jsx'
import DeleteModal from './DeleteModal.jsx'
import MoveModal from './MoveModal.jsx'
import ColumnSubmenu from './ColumnSubmenu.jsx'

// ⋯ menu with Rename / Move / Delete for a file or folder ({ name, path, type }).
// onRename(item, name) returns an error message or null.
// onMove(item, targetFolder) returns an error message or null.
// inList: inside a file-browser row — medium (32px), ghost (no border), smaller icon, with its own
// lighter fill on hover over the row's highlight
// default (title bar of the open folder or file): ghost-outline with a more visible border
// hoverReveal (with inList): with a mouse, hidden until its row (`group`) is hovered, it's focused or its menu is open; always shown on touch
// columns (an open card of a board opened from its view): { columns, column, onSelect } for a Move to column submenu
// view / onView (File manager's title bar): an icon-only List | Cards switch on top of the menu;
// with no `item` (the root folder, which can't be renamed, moved or deleted) it's all the menu has
const VIEWS = [['list', 'List', Rows], ['cards', 'Cards', SquaresFour]]

export default function ItemMenu({ item, onRename, onDelete, onMove, folders, inList, hoverReveal, view, onView, columns }) {
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [moving, setMoving] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={inList ? 'ghost' : 'ghost-outline'}
            size="icon"
            aria-label="More actions"
            className={cn(
              inList ? 'size-control-md shrink-0 text-muted-foreground hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10' : 'shrink-0 border-muted-foreground/50',
              hoverReveal && 'pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100 pointer-fine:data-[state=open]:opacity-100',
            )}
          >
            <DotsThree weight="bold" size={inList ? 16 : 20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
          {onView && (
            <div className="p-1">
              <Segmented value={view} onChange={onView} options={VIEWS} label="View" iconOnly />
            </div>
          )}
          {onView && item && <DropdownMenuSeparator />}
          {item && <>
            <DropdownMenuItem onSelect={() => setRenaming(true)}><PencilSimple /> Rename</DropdownMenuItem>
            {columns && <ColumnSubmenu columns={columns.columns} column={columns.column} onSelect={columns.onSelect} />}
            {onMove && <DropdownMenuItem onSelect={() => setMoving(true)}><Folder /> Move to…</DropdownMenuItem>}
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}><Trash /> Delete</DropdownMenuItem>
          </>}
        </DropdownMenuContent>
      </DropdownMenu>

      {renaming && (
        <RenameModal
          item={item}
          onRename={name => {
            const err = onRename(item, name)
            if (!err) setRenaming(false)
            return err
          }}
          onClose={() => setRenaming(false)}
        />
      )}

      {deleting && (
        <DeleteModal
          item={item}
          onDelete={() => { setDeleting(false); onDelete(item) }}
          onClose={() => setDeleting(false)}
        />
      )}

      {moving && (
        <MoveModal
          item={item}
          folders={folders || []}
          onMove={onMove}
          onClose={() => setMoving(false)}
        />
      )}
    </>
  )
}
