import { useState } from 'react'
import { PencilSimple, Trash, Folder, Rows, SquaresFour, Columns, Copy, LinkSimple, Lock, LockOpen, Smiley, FolderOpen } from '@phosphor-icons/react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from './ui/dropdown-menu.jsx'
import { Segmented } from './ui/segmented.jsx'
import RenameModal from './RenameModal.jsx'
import DeleteModal from './DeleteModal.jsx'
import MoveModal from './MoveModal.jsx'
import ColumnSubmenu from './ColumnSubmenu.jsx'
import { EmojiGrid } from './EmojiPicker.jsx'
import { useIconsContext } from '../hooks/useIcons.js'
import { copyText } from '../lib/clipboard.js'
import { repoLink } from '../lib/markdown.js'
import { useIsDesktop } from '../hooks/useIsDesktop.js'
import MoreButton from './MoreButton.jsx'

// ⋯ menu with Rename / Move / Delete for a file or folder ({ name, path, type }).
// onRename(item, name) returns an error message or null.
// onMove(item, targetFolder) returns an error message or null.
// onDuplicate(item): a copy of a file next to it (not offered for a folder).
// Copy link: a markdown link to the item from the repo's root (`repoLink`), to paste in another note.
// inList: inside a file-browser row — medium (32px), ghost (no border), smaller icon, with its own
// lighter fill on hover over the row's highlight
// default (title bar of the open folder or file): ghost-outline with a more visible border
// hoverReveal (with inList): with a mouse, hidden until its row (`group`) is hovered, it's focused or its menu is open; always shown on touch
// columns (an open card of a board opened from its view): { columns, column, onSelect } for a Move to column submenu
// lock ({ locked, onToggle }; a note's page): Lock / Unlock (lib/locks.js); a locked file has no Move to column and no Remove
// onReveal(item): Show in folder (the Assets page: opens the item's folder in File manager)
// Emoji (every file and folder): a sub menu with the emoji picker (`EmojiGrid`) for its icon (lib/icons.js, `IconsContext`);
// disabled while the icons can't be saved
// view / onView (File manager's title bar): an icon-only List | Cards | Columns switch on top of the menu (Columns from 768px);
// with no `item` (the root folder, which can't be renamed, moved or deleted) it's all the menu has
const VIEWS = [['list', 'List', Rows], ['cards', 'Cards', SquaresFour], ['columns', 'Columns', Columns]]

export default function ItemMenu({ item, onReveal, onRename, onDuplicate, onDelete, onMove, folders, inList, hoverReveal, view, onView, columns, lock }) {
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [moving, setMoving] = useState(false)
  const [open, setOpen] = useState(false)
  const desktop = useIsDesktop()
  const icons = useIconsContext()

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <MoreButton inRow={inList} reveal={hoverReveal} aria-label="More actions" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
          {onView && (
            <div className="p-space-xs">
              <Segmented stretch value={view} onChange={onView} options={desktop ? VIEWS : VIEWS.filter(([v]) => v !== 'columns')} label="View" iconOnly />
            </div>
          )}
          {onView && item && <DropdownMenuSeparator />}
          {item && <>
            {onReveal && <DropdownMenuItem onSelect={() => onReveal(item)}><FolderOpen /> Show in folder</DropdownMenuItem>}
            <DropdownMenuItem onSelect={() => setRenaming(true)}><PencilSimple /> Rename</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={!icons.onSet}><Smiley /> Emoji</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-space-sm">
                <EmojiGrid value={icons.iconOf(item.path)} onPick={emoji => icons.onSet(item.path, emoji)} onDone={() => setOpen(false)} />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {columns && !lock?.locked && <ColumnSubmenu columns={columns.columns} column={columns.column} onSelect={columns.onSelect} />}
            {onMove && <DropdownMenuItem onSelect={() => setMoving(true)}><Folder /> Move to…</DropdownMenuItem>}
            {onDuplicate && item.type !== 'dir' && <DropdownMenuItem onSelect={() => onDuplicate(item)}><Copy /> Duplicate</DropdownMenuItem>}
            <DropdownMenuItem onSelect={() => copyText(repoLink(item.path), 'Link copied')}><LinkSimple /> Copy link</DropdownMenuItem>
            {lock && <DropdownMenuItem disabled={!lock.onToggle} onSelect={lock.onToggle}>{lock.locked ? <><LockOpen /> Unlock</> : <><Lock /> Lock</>}</DropdownMenuItem>}
            {!lock?.locked && <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}><Trash /> Remove</DropdownMenuItem>}
          </>}
        </DropdownMenuContent>
      </DropdownMenu>

      {renaming && (
        <RenameModal
          item={item}
          onRename={(name, title) => {
            const err = onRename(item, name, title)
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
