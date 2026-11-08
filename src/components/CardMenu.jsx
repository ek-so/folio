import { useState } from 'react'
import { PencilSimple, Trash, Columns, Copy, TextAlignLeft, LinkSimple, CheckCircle, Lock, LockOpen } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import ColumnSubmenu from '@/components/ColumnSubmenu.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import DeleteModal from '@/components/DeleteModal.jsx'
import RenameModal from '@/components/RenameModal.jsx'
import { copyText } from '@/lib/clipboard.js'
import { repoLink } from '@/lib/markdown.js'
import { cn, own } from '@/lib/utils.js'
import { fileItem } from '@/lib/folderNotes.js'
import { properties, valueList, DESCRIPTION } from '@/lib/frontmatter.js'
import MoreButton from './MoreButton.jsx'

// The CardMenu props every widget's card gives the same way (a board's, a planner's): its description, and
// editing it (`act`: the widget's useFolderNotes actions), renaming (title and file name together), duplicating (`services`: the app's) and removing it.
// `text`: its note (undefined when it isn't on this device). The widget adds its own (Mark as done, Move to column)
// A locked card (lib/locks.js) has no Edit description and no Remove; Lock / Unlock toggles it.
export const cardActions = (path, text, act, services) => {
  const locked = services.locked(path)
  return {
    path,
    description: text === undefined ? '' : valueList(properties(text)[DESCRIPTION] ?? '').join(', '),
    onDescription: act.canEditText(path) && !locked ? value => act.setDescription(path, value) : undefined,
    onRename: (name, title) => services.rename(fileItem(path), name, title),
    onDuplicate: () => services.duplicate(fileItem(path)),
    onDelete: locked ? undefined : () => act.deleteCard(path),
    lock: { locked, onToggle: services.canLock ? () => services.toggleLock(path) : undefined },
  }
}

// A card's ⋯ menu, a board's and a planner's (hidden until the card is hovered with a mouse, always shown on touch):
// Mark as done (only with `onDone`, a planner's), Add / Edit
// description (`description`, its text; only with `onDescription`, a note on this device), Rename (its title and file
// name together, `RenameModal`; `onRename(name, title)` returns an error or null), Duplicate (a copy of the file next to it), Copy link (`repoLink`), Move to column (only with `columns`, a board's: a submenu of its
// columns, then Edit columns… that opens its Columns dialog) and Remove (the file, to the archive like anywhere else, confirmed). `columns`: [{ key, name }] shown,
// `column`: the card's key. `inRow`: in a list row (a planner's list view), which has its own padding: none pulled into the corner. Its dialogs are in a `contents` div so a click in them stays
// theirs, never the card's.
export default function CardMenu({ path, description, columns, column, onDone, onDescription, onRename, onDuplicate, onMove, onEditColumns, onDelete, inRow, lock }) {
  const [editing, setEditing] = useState(null) // 'description' while its dialog is open
  const [renaming, setRenaming] = useState(false)
  const item = fileItem(path)
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="contents" {...own}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <MoreButton inRow reveal aria-label="Card actions" className={cn(!inRow && '-my-1.5 -mr-1.5')} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
          {onDone && <>
            <DropdownMenuItem onSelect={onDone}><CheckCircle /> Mark as done</DropdownMenuItem>
            <DropdownMenuSeparator />
          </>}
          {onDescription && <DropdownMenuItem onSelect={() => setEditing('description')}><TextAlignLeft /> {description ? 'Edit' : 'Add'} description</DropdownMenuItem>}
          <DropdownMenuItem onSelect={() => setRenaming(true)}><PencilSimple /> Rename</DropdownMenuItem>
          <DropdownMenuItem onSelect={onDuplicate}><Copy /> Duplicate</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => copyText(repoLink(path), 'Link copied')}><LinkSimple /> Copy link</DropdownMenuItem>
          {lock && <DropdownMenuItem disabled={!lock.onToggle} onSelect={lock.onToggle}>{lock.locked ? <><LockOpen /> Unlock</> : <><Lock /> Lock</>}</DropdownMenuItem>}
          {columns && (
            <ColumnSubmenu columns={columns} column={column} onSelect={onMove}>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onEditColumns}><Columns /> Edit columns…</DropdownMenuItem>
            </ColumnSubmenu>
          )}
          {onDelete && <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}><Trash /> Remove</DropdownMenuItem>
          </>}
        </DropdownMenuContent>
      </DropdownMenu>
      {editing === 'description' && (
        <TextModal title={description ? 'Edit description' : 'Add description'} label="Description" value={description} onSave={value => { setEditing(null); onDescription(value) }} onClose={() => setEditing(null)} />
      )}
      {renaming && (
        <RenameModal
          item={item}
          onRename={(name, title) => { const err = onRename(name, title); if (!err) setRenaming(false); return err }}
          onClose={() => setRenaming(false)}
        />
      )}
      {deleting && (
        <DeleteModal
          item={item}
          onDelete={() => { setDeleting(false); onDelete() }}
          onClose={() => setDeleting(false)}
        />
      )}
    </div>
  )
}

// The card's description, one line of its note to edit
function TextModal({ title, description, label, value: initial, onSave, onClose }) {
  const [value, setValue] = useState(initial)
  return (
    <BottomSheet title={title} description={description} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(value.trim()) }} className="flex flex-col gap-3">
        <Input value={value} onChange={e => setValue(e.target.value)} aria-label={label} placeholder={label} autoCorrect="off" className="bg-background border-border" />
        <div className="flex justify-end gap-space-sm">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
