import { useState } from 'react'
import { Columns, TextAlignLeft, CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import ColumnSubmenu from '@/components/ColumnSubmenu.jsx'
import BottomSheet from '@/components/BottomSheet.jsx'
import { cn, own } from '@/lib/utils.js'
import { fileItem } from '@/lib/folderNotes.js'
import { properties, valueList, DESCRIPTION } from '@/lib/frontmatter.js'
import ItemMenu from './ItemMenu.jsx'

// The CardMenu props every widget's card gives the same way (a board's, a planner's): its description and editing it
// (`act`: the widget's useFolderNotes actions). `text`: its note (undefined when it isn't on this device). The widget adds
// its own (Mark as done, Move to column). A locked card (lib/locks.js) has no Edit description.
export const cardActions = (path, text, act, services) => ({
  path,
  description: text === undefined ? '' : valueList(properties(text)[DESCRIPTION] ?? '').join(', '),
  onDescription: act.canEditText(path) && !services.locked(path) ? value => act.setDescription(path, value) : undefined,
})

// A card's ⋯, a board's and a planner's (hidden until the card is hovered with a mouse, always shown on touch): its file's
// ItemMenu (Show in folder, the core, Remove) with what only a card offers on top: Mark as done (only with `onDone`, a
// planner's), Add / Edit description (`description`, its text; only with `onDescription`, a note on this device) and Move
// to column (only with `columns`, a board's: a submenu of its columns, `column` the card's key, then Edit columns… that
// opens its Columns dialog; `onMove(key)`). `inRow`: in a list row (a planner's list view), which has its own padding:
// none pulled into the corner. Its dialogs are in a `contents` div so a click in them stays theirs, never the card's.
export default function CardMenu({ path, description, columns, column, onDone, onDescription, onMove, onEditColumns, inRow }) {
  const [editing, setEditing] = useState(false) // the description's dialog is open
  return (
    <div className="contents" {...own}>
      <ItemMenu
        item={fileItem(path)} reveal inList hoverReveal label="Card actions" className={cn(!inRow && '-my-1.5 -mr-1.5')}
        extra={<>
          {onDone && <DropdownMenuItem onSelect={onDone}><CheckCircle /> Mark as done</DropdownMenuItem>}
          {onDescription && <DropdownMenuItem onSelect={() => setEditing(true)}><TextAlignLeft /> {description ? 'Edit' : 'Add'} description</DropdownMenuItem>}
          {columns && (
            <ColumnSubmenu columns={columns} column={column} onSelect={onMove}>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onEditColumns}><Columns /> Edit columns…</DropdownMenuItem>
            </ColumnSubmenu>
          )}
        </>}
      />
      {editing && (
        <TextModal title={description ? 'Edit description' : 'Add description'} label="Description" value={description} onSave={value => { setEditing(false); onDescription(value) }} onClose={() => setEditing(false)} />
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
