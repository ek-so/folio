import { PencilSimple, Trash, SquaresFour, SlidersHorizontal, Plus } from '@phosphor-icons/react'
import { DropdownMenuItem } from './ui/dropdown-menu.jsx'
import MoreMenu from './MoreMenu.jsx'
import { cn } from '@/lib/utils.js'

// A view's ⋯. On its page's title bar: Edit widgets (its Edit widgets sheet), then Rename, then Remove; `inRow`, on its row
// in the navigation (rail and the phone's ☰ sheet; a medium ⋯ shown while the row is hovered, with a mouse; always on
// touch): Rename, then Remove. `actions` is App's `viewActions` (`onRename(view)`, `onDelete(view)`; and on its page
// ViewPage's `onEditWidgets()`;
// disabled while the views can't be changed, `canEdit`). `onPick` runs first (the ☰ sheet closes).
export default function ViewMenu({ view, actions, inRow, onPick = () => {} }) {
  const disabled = !actions.canEdit
  const pick = fn => () => { onPick(); fn(view) }
  return (
    <MoreMenu
      label={inRow ? `Actions for ${view.title}` : 'View actions'} inRow={inRow} reveal={inRow} align={inRow ? 'start' : 'end'}
      sections={[
        !inRow && <DropdownMenuItem disabled={disabled} onSelect={pick(actions.onEditWidgets)}><SquaresFour /> Edit widgets</DropdownMenuItem>,
        <DropdownMenuItem disabled={disabled} onSelect={pick(actions.onRename)}><PencilSimple /> Rename</DropdownMenuItem>,
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
    <div className={cn('flex min-h-control-md items-center gap-space-sm', collapsed ? 'justify-center' : 'pl-3 pr-1', className)}>
      <h2 className={collapsed ? 'sr-only' : 'min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground'}>Views</h2>
      <MoreMenu
        label="Views actions" inRow
        sections={[<>
          <DropdownMenuItem disabled={disabled} onSelect={pick(actions.onNewView)}><Plus /> New view</DropdownMenuItem>
          <DropdownMenuItem disabled={disabled} onSelect={pick(actions.onEditViews)}><SlidersHorizontal /> Edit views</DropdownMenuItem>
        </>]}
      />
    </div>
  )
}
