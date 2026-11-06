import { useState } from 'react'
import { DotsThree, PencilSimple, Trash, Columns, Copy, TextT, TextAlignLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import ColumnSubmenu from '@/components/ColumnSubmenu.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import DeleteModal from '@/components/DeleteModal.jsx'
import RenameModal from '@/components/RenameModal.jsx'
import { own } from '@/lib/utils.js'

// A card's ⋯ menu (hidden until the card is hovered with a mouse, always shown on touch):
// Edit title (the card's title, not the file's name; only with `onTitle`: a note on this device), Add / Edit
// description (`description`, its text; only with `onDescription`, a note on this device), Rename file (its file's
// name, `RenameModal`; `onRename(name)` returns an error or null), Duplicate (a copy of the file next to it), Move to column (a submenu of the
// board's columns, then Edit columns… that opens the board's Columns dialog), Delete (the file, confirmed like any delete). `columns`: [{ key, name }] shown,
// `column`: the card's key. Its dialogs are in a `contents` div so a click in them stays
// theirs, never the card's.
export default function CardMenu({ path, title, description, columns, column, onTitle, onDescription, onRename, onDuplicate, onMove, onEditColumns, onDelete }) {
  const [editing, setEditing] = useState(null) // 'title' | 'description' while its dialog is open
  const [renaming, setRenaming] = useState(false)
  const item = { name: path.slice(path.lastIndexOf('/') + 1), path, type: 'file' }
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="contents" {...own}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Card actions"
            className="-my-1.5 -mr-1.5 size-control-md shrink-0 text-muted-foreground hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100 pointer-fine:data-[state=open]:opacity-100"
          >
            <DotsThree weight="bold" size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
          {onTitle && <DropdownMenuItem onSelect={() => setEditing('title')}><TextT /> Edit title</DropdownMenuItem>}
          {onDescription && <DropdownMenuItem onSelect={() => setEditing('description')}><TextAlignLeft /> {description ? 'Edit' : 'Add'} description</DropdownMenuItem>}
          <DropdownMenuItem onSelect={() => setRenaming(true)}><PencilSimple /> Rename file</DropdownMenuItem>
          <DropdownMenuItem onSelect={onDuplicate}><Copy /> Duplicate</DropdownMenuItem>
          <ColumnSubmenu columns={columns} column={column} onSelect={onMove}>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onEditColumns}><Columns /> Edit columns…</DropdownMenuItem>
          </ColumnSubmenu>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}><Trash /> Remove</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {editing === 'title' && (
        <TextModal title="Edit title" description="Changes the card's title, not the file's name." label="Title" value={title} onSave={value => { setEditing(null); onTitle(value) }} onClose={() => setEditing(null)} />
      )}
      {editing === 'description' && (
        <TextModal title={description ? 'Edit description' : 'Add description'} label="Description" value={description} onSave={value => { setEditing(null); onDescription(value) }} onClose={() => setEditing(null)} />
      )}
      {renaming && (
        <RenameModal
          item={item}
          onRename={name => { const err = onRename(name); if (!err) setRenaming(false); return err }}
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

// One line of the card's note to edit: its title (the `title` property; empty: the note's first heading,
// else its file name, is shown again; the file keeps its name) or its description
function TextModal({ title, description, label, value: initial, onSave, onClose }) {
  const [value, setValue] = useState(initial)
  return (
    <BottomSheet title={title} description={description} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(value.trim()) }} className="flex flex-col gap-3">
        <Input value={value} onChange={e => setValue(e.target.value)} aria-label={label} placeholder={label} autoCorrect="off" className="bg-background border-border" />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
