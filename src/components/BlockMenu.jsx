import { useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import MoreMenu from './MoreMenu.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import { DropdownMenuItem } from './ui/dropdown-menu.jsx'
import { useSingleOpen } from '../hooks/useSingleOpen.jsx'
import { own } from '@/lib/utils.js'

// The ⋯ of every individual item in the note preview, on its right (the drag handle's counterpart on the left): a list
// item, a heading, a paragraph, a table, a quote… `noun` names it in the dialog. Its menu: what only this kind of item
// offers (`extra`: a list item's Up next), then Remove (the item with what belongs to it, confirmed: `removes` says what
// goes with it, in the dialog), the same for all.
export default function BlockMenu({ noun, removes, extra, onRemove }) {
  const [open, setOpen] = useSingleOpen()
  const [removing, setRemoving] = useState(false)
  return (
    <>
      <span {...own} className="contents">
        <MoreMenu
          small label={`More actions for this ${noun}`} open={open} onOpenChange={setOpen}
          sections={[extra, <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(true)}><Trash /> Remove</DropdownMenuItem>]}
        />
      </span>
      {removing && (
        <ConfirmModal
          title={`Remove this ${noun}?`} description={removes ?? 'It is taken out of the note.'}
          onConfirm={() => { setRemoving(false); onRemove() }} onClose={() => setRemoving(false)}
        />
      )}
    </>
  )
}
