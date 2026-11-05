import { Plus, Kanban } from '@phosphor-icons/react'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import Board from './Board.jsx'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'

// A view (Home…): its title bar with + (Add widget), over its widgets,
// stacked full width (a dashboard). `widgets` are the view's ({ id, type });
// `boards[id]` each board's { ready, board, data } (App); `actions` what the widgets can do (App).
// Until the config is read (`canEdit` false) nothing can be added.
export default function ViewPage({ page, widgets = [], boards, notes, canEdit, actions }) {
  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" aria-label="Add widget" title="Add widget" disabled={!canEdit} className="shrink-0">
          <Plus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
        <DropdownMenuItem onSelect={() => actions.onAddBoard(page)}><Kanban /> Board</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  return (
    <PageLayout>
      <Surface tree wide title={<TitleBar page={page}>{addMenu}</TitleBar>}>
        <div className="flex min-h-0 flex-1 flex-col gap-space overflow-y-auto p-space">
          {widgets.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-space py-12 text-center">
              <p className="text-sm text-muted-foreground">Nothing on this view yet.</p>
              <Button variant="secondary" disabled={!canEdit} onClick={() => actions.onAddBoard(page)}><Kanban /> Add board</Button>
            </div>
          ) : widgets.map(w => (
            <Board key={w.id} id={w.id} {...boards[w.id]} notes={notes} canEdit={canEdit} actions={actions} onRemove={() => actions.onRemoveWidget(page, w.id)} />
          ))}
        </div>
      </Surface>
    </PageLayout>
  )
}
