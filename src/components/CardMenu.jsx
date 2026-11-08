import { useState } from 'react'
import { DotsThree, PencilSimple, Trash, Columns, Copy, TextT, TextAlignLeft, LinkSimple, CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import ColumnSubmenu from '@/components/ColumnSubmenu.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import DeleteModal from '@/components/DeleteModal.jsx'
import RenameModal from '@/components/RenameModal.jsx'
import { copyText } from '@/lib/clipboard.js'
import { repoLink } from '@/lib/markdown.js'
import { own } from '@/lib/utils.js'
import { fileItem, cardTitle } from '@/lib/folderNotes.js'
import { properties, valueList, DESCRIPTION } from '@/lib/frontmatter.js'

// The CardMenu props every widget's card gives the same way (a board's, a planner's): its title and description, and
// editing them (`act`: the widget's useFolderNotes actions), renaming, duplicating (`services`: the app's) and removing it.
// `text`: its note (undefined when it isn't on this device). The widget adds its own (Mark as done, Move to column)
export const cardActions = (path, text, act, services) => ({
  path,
  title: cardTitle(path, text),
  onTitle: act.canTitle(path) ? title => act.setTitle(path, title) : undefined,
  description: text === undefined ? '' : valueList(properties(text)[DESCRIPTION] ?? '').join(', '),
  onDescription: act.canTitle(path) ? value => act.setDescription(path, value) : undefined,
  onRename: name => services.rename(fileItem(path), name),
  onDuplicate: () => services.duplicate(fileItem(path)),
  onDelete: () => act.deleteCard(path),
})

// A card's ⋯ menu, a board's and a planner's (hidden until the card is hovered with a mouse, always shown on touch):
// Mark as done (only with `onDone`, a planner's), Edit title (the card's title, not the file's name; only with `onTitle`: a note on this device), Add / Edit
// description (`description`, its text; only with `onDescription`, a note on this device), Rename file (its file's
// name, `RenameModal`; `onRename(name)` returns an error or null), Duplicate (a copy of the file next to it), Copy link (`repoLink`), Move to column (only with `columns`, a board's: a submenu of its
// columns, then Edit columns… that opens its Columns dialog) and Remove (the file, to the archive like anywhere else, confirmed). `columns`: [{ key, name }] shown,
// `column`: the card's key. Its dialogs are in a `contents` div so a click in them stays
// theirs, never the card's.
export default function CardMenu({ path, title, description, columns, column, onDone, onTitle, onDescription, onRename, onDuplicate, onMove, onEditColumns, onDelete }) {
  const [editing, setEditing] = useState(null) // 'title' | 'description' while its dialog is open
  const [renaming, setRenaming] = useState(false)
  const item = fileItem(path)
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
          {onDone && <>
            <DropdownMenuItem onSelect={onDone}><CheckCircle /> Mark as done</DropdownMenuItem>
            <DropdownMenuSeparator />
          </>}
          {onTitle && <DropdownMenuItem onSelect={() => setEditing('title')}><TextT /> Edit title</DropdownMenuItem>}
          {onDescription && <DropdownMenuItem onSelect={() => setEditing('description')}><TextAlignLeft /> {description ? 'Edit' : 'Add'} description</DropdownMenuItem>}
          <DropdownMenuItem onSelect={() => setRenaming(true)}><PencilSimple /> Rename file</DropdownMenuItem>
          <DropdownMenuItem onSelect={onDuplicate}><Copy /> Duplicate</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => copyText(repoLink(path), 'Link copied')}><LinkSimple /> Copy link</DropdownMenuItem>
          {columns && (
            <ColumnSubmenu columns={columns} column={column} onSelect={onMove}>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onEditColumns}><Columns /> Edit columns…</DropdownMenuItem>
            </ColumnSubmenu>
          )}
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
