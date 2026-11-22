import { useState } from 'react'
import { PencilSimple, Trash, SquaresFour, SlidersHorizontal, Plus } from '@phosphor-icons/react'
import { EmojiSubmenu } from './EmojiPicker.jsx'
import { DropdownMenuItem } from './ui/dropdown-menu.jsx'
import MoreMenu from './MoreMenu.jsx'
import { SectionTitle } from './ui/section-title.jsx'

// A view's ⋯. On its page's title bar: Edit widgets (its Edit widgets sheet), then Rename and Emoji, then Remove; `inRow`, on
// its row in the navigation (rail and the phone's ☰ sheet; a medium ⋯ shown while the row is hovered, with a mouse; always
// on touch): Rename and Emoji, then Remove. `actions` is App's `viewActions` (`onRename(view)`, `onIcon(view, emoji)`
// (picking one keeps the ☰ sheet open), `onDelete(view)`; and on its page
// ViewPage's `onEditWidgets()`;
// disabled while the views can't be changed, `canEdit`). `onPick` runs first (the ☰ sheet closes).
export default function ViewMenu({ view, actions, inRow, onPick = () => {} }) {
  const disabled = !actions.canEdit
  const pick = fn => () => { onPick(); fn(view) }
  const [open, setOpen] = useState(false)
  return (
    <MoreMenu
      label={inRow ? `Actions for ${view.title}` : 'View actions'} inRow={inRow} reveal={inRow} align={inRow ? 'start' : 'end'}
      open={open} onOpenChange={setOpen}
      sections={[
        !inRow && <DropdownMenuItem disabled={disabled} onSelect={pick(actions.onEditWidgets)}><SquaresFour /> Edit widgets</DropdownMenuItem>,
        <>
          <DropdownMenuItem disabled={disabled} onSelect={pick(actions.onRename)}><PencilSimple /> Rename</DropdownMenuItem>
          <EmojiSubmenu value={view.emoji} onPick={disabled ? null : emoji => actions.onIcon(view, emoji)} onDone={() => setOpen(false)} />
        </>,
        <DropdownMenuItem variant="destructive" disabled={disabled} onSelect={pick(actions.onDelete)}><Trash /> Remove</DropdownMenuItem>,
      ]}
    />
  )
}

// The title of the navigation's views (rail and ☰), "Views", small and muted, with its ⋯ on the right: New view (asks
// for its name, then opens it) and Edit views (every view: order, emoji, add, remove). `actions`: App's `viewActions`
// (`onNewView()`, `onEditViews()`); `onPick` runs first (the ☰ sheet closes). `className`: its padding, so its ⋯ lines up with
// the ⋯ of the view rows under it (the rail's and ☰'s rows hold theirs differently).
// `collapsed` (the rail as icons): only the ⋯, centered, the title for screen readers.
export function ViewsTitle({ actions, onPick = () => {}, className, collapsed }) {
  const disabled = !actions.canEdit
  const pick = fn => () => { onPick(); fn() }
  return (
    <SectionTitle
      hidden={collapsed} className={className}
      trailing={(
        <MoreMenu
          label="Views actions" inRow
          sections={[<>
            <DropdownMenuItem disabled={disabled} onSelect={pick(actions.onNewView)}><Plus /> New view</DropdownMenuItem>
            <DropdownMenuItem disabled={disabled} onSelect={pick(actions.onEditViews)}><SlidersHorizontal /> Edit views</DropdownMenuItem>
          </>]}
        />
      )}
    >
      Views
    </SectionTitle>
  )
}
