import { PencilSimple, Trash, SquaresFour, SlidersHorizontal } from '@phosphor-icons/react'
import { DropdownMenuItem } from './ui/dropdown-menu.jsx'
import MoreMenu from './MoreMenu.jsx'

// A view's ⋯, the same in its title bar and in the navigation (rail and the phone's ☰ sheet): Edit widgets (opens the
// view with its Edit widgets sheet) and Edit views (every view: order, emoji, add, remove), then Rename, then Remove.
// `actions` is App's `viewActions` (`onEditWidgets(view)`, `onEditViews()`, `onRename(view)`, `onDelete(view)`; disabled while the views can't be changed, `canEdit`). `onPick` runs first (the
// ☰ sheet closes). `inRow`: in a navigation row (a medium ⋯ shown while the row is hovered, with a mouse; always on touch).
export default function ViewMenu({ view, actions, inRow, onPick = () => {} }) {
  const disabled = !actions.canEdit
  const pick = fn => () => { onPick(); fn(view) }
  return (
    <MoreMenu
      label={inRow ? `Actions for ${view.title}` : 'View actions'} inRow={inRow} reveal={inRow} align={inRow ? 'start' : 'end'}
      sections={[
        <>
          <DropdownMenuItem disabled={disabled} onSelect={pick(actions.onEditWidgets)}><SquaresFour /> Edit widgets</DropdownMenuItem>
          <DropdownMenuItem disabled={disabled} onSelect={pick(actions.onEditViews)}><SlidersHorizontal /> Edit views</DropdownMenuItem>
        </>,
        <DropdownMenuItem disabled={disabled} onSelect={pick(actions.onRename)}><PencilSimple /> Rename</DropdownMenuItem>,
        <DropdownMenuItem variant="destructive" disabled={disabled} onSelect={pick(actions.onDelete)}><Trash /> Remove</DropdownMenuItem>,
      ]}
    />
  )
}
