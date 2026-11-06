import { useState } from 'react'
import { DotsThree, PencilSimple, Trash, Columns } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import ColumnSubmenu from '@/components/ColumnSubmenu.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import DeleteModal from '@/components/DeleteModal.jsx'
import { own } from '@/components/PropertyBadges.jsx'

// A card's ⋯ menu (hidden until the card is hovered with a mouse, always shown on touch):
// Edit title (the card's title, not the file's name), Move to column (a submenu of the
// board's columns, then Edit columns… that opens the board's Columns dialog), Delete (the file, confirmed like any delete). `columns`: [{ key, name }] shown,
// `column`: the card's key. Its dialogs are in a `contents` div so a click in them stays
// theirs, never the card's.
export default function CardMenu({ path, title, columns, column, onTitle, onMove, onEditColumns, onDelete }) {
  const [editing, setEditing] = useState(false)
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
          <DropdownMenuItem onSelect={() => setEditing(true)}><PencilSimple /> Edit title</DropdownMenuItem>
          <ColumnSubmenu columns={columns} column={column} onSelect={onMove}>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onEditColumns}><Columns /> Edit columns…</DropdownMenuItem>
          </ColumnSubmenu>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}><Trash /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {editing && <TitleModal title={title} onSave={value => { setEditing(false); onTitle(value) }} onClose={() => setEditing(false)} />}
      {deleting && (
        <DeleteModal
          item={{ name: path.slice(path.lastIndexOf('/') + 1), path, type: 'file' }}
          onDelete={() => { setDeleting(false); onDelete() }}
          onClose={() => setDeleting(false)}
        />
      )}
    </div>
  )
}

// The card's title, as its note's `title` property (the file keeps its name). Empty: the note's
// first heading, else its file name, is shown again.
function TitleModal({ title, onSave, onClose }) {
  const [value, setValue] = useState(title)
  return (
    <BottomSheet title="Edit title" description="Changes the card's title, not the file's name." onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(value.trim()) }} className="flex flex-col gap-3">
        <Input value={value} onChange={e => setValue(e.target.value)} aria-label="Title" autoCorrect="off" className="bg-background border-border" />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
