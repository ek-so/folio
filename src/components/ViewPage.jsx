import { useState } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import TitleBar from './TitleBar.jsx'
import EditListModal from './EditListModal.jsx'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import { WIDGET_TYPES, widgetType, widgetTitle } from '../widgets/index.js'
import ViewMenu from './ViewMenu.jsx'
import RenameModal from './RenameModal.jsx'
import { WidgetContext } from './WidgetFrame.jsx'

// A view (Home…, `view`: its page): its title bar with + (Add widget: every kind in widgets/index.js) and ⋯
// (`ViewMenu`, as in the navigation, with App's `viewActions`), over its widgets ({ id, type }), stacked full width (a dashboard),
// and Add widget under them. Each widget is its kind's own component, given the app's `services`;
// `onAdd(type)`, `onRemove(id)` (always confirmed first: a widget's own Remove asks here),
// `onMove(from, to)` (Edit widgets: order and remove them in one sheet), `onRenameWidget(id, name)` (a widget's Rename, its
// own name; empty: its kind's again). Its ⋯'s Edit widgets opens its own sheet.
// Until the settings are read (`services.canEdit` false) nothing can be added.
// `error`: why the views can't be changed (shown on top), or null.
export default function ViewPage({ page, view, viewActions, widgets = [], error, services, onAdd, onRemove, onMove, onRenameWidget }) {
  const { canEdit } = services
  const [removing, setRemoving] = useState(null) // the widget whose Remove is being confirmed
  const [editing, setEditing] = useState(false) // Edit widgets is open
  const [renaming, setRenaming] = useState(null) // the widget being renamed
  const kinds = WIDGET_TYPES.map(t => <DropdownMenuItem key={t.type} onSelect={() => onAdd(t.type)}><t.icon /> {t.label}</DropdownMenuItem>)
  // Add widget: a menu of every kind, from `trigger`
  const addMenu = (trigger, align = 'end') => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} onCloseAutoFocus={e => e.preventDefault()}>{kinds}</DropdownMenuContent>
    </DropdownMenu>
  )
  return (
    <PageLayout>
      <Surface wide title={
        <TitleBar page={page}>
          {view && <ViewMenu view={view} actions={{ ...viewActions, onEditWidgets: () => setEditing(true) }} />}
          {addMenu(<Button size="icon" aria-label="Add widget" tooltip="Add widget" disabled={!canEdit} className="shrink-0"><Plus /></Button>)}
        </TitleBar>
      }>
        <div className="flex min-h-0 flex-1 flex-col gap-space overflow-y-auto p-space">
          {error && <p className="text-center text-sm text-destructive-ink">{error}</p>}
          {widgets.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-space py-12 text-center">
              <p className="text-sm text-muted-foreground">Nothing on this view yet.</p>
              {addMenu(<Button variant="secondary" disabled={!canEdit}><Plus /> Add widget</Button>, 'center')}
            </div>
          ) : <>
            {widgets.map(w => {
              const type = widgetType(w.type)
              return type
                ? (
                  <WidgetContext.Provider key={w.id} value={{ name: w.name, onRename: canEdit ? () => setRenaming(w) : null }}>
                    <type.Widget id={w.id} services={services} onRemove={() => setRemoving(w)} />
                  </WidgetContext.Provider>
                )
                : <UnknownWidget key={w.id} type={w.type} canEdit={canEdit} onRemove={() => setRemoving(w)} />
            })}
            <div className="flex shrink-0 justify-center">
              {addMenu(<Button variant="secondary" disabled={!canEdit}><Plus /> Add widget</Button>, 'center')}
            </div>
          </>}
        </div>
      </Surface>
      {editing && (
        <EditListModal
          title="Edit widgets"
          description="Drag them into the order they show on this view."
          items={widgets.map(w => {
            const type = widgetType(w.type)
            return { id: w.id, type: w.type, icon: type ? <type.icon /> : null, title: type ? widgetTitle(w, services) : w.type }
          })}
          onMove={onMove}
          onRemove={setRemoving}
          empty="No widgets on this view yet."
          onClose={() => setEditing(false)}
        />
      )}
      {renaming && (
        <RenameModal
          kind="widget"
          placeholder={widgetTitle({ ...renaming, name: undefined }, services)}
          item={{ name: widgetTitle(renaming, services), type: 'dir' }}
          onRename={name => { onRenameWidget(renaming.id, name); setRenaming(null); return null }}
          onClose={() => setRenaming(null)}
        />
      )}
      {removing && (
        <ConfirmModal
          title={`Remove this ${(widgetType(removing.type)?.label ?? 'widget').toLowerCase()}?`}
          description="Its settings are removed from this view. The files it shows stay as they are."
          confirm="Remove"
          onConfirm={() => { onRemove(removing.id); setRemoving(null) }}
          onClose={() => setRemoving(null)}
        />
      )}
    </PageLayout>
  )
}

// A widget of a kind this version doesn't know (added by a newer one): kept, and it can be removed
function UnknownWidget({ type, canEdit, onRemove }) {
  return (
    <section className="flex items-center gap-space-sm rounded-lg border border-border p-space-sm">
      <p className="min-w-0 flex-1 px-space-xs text-sm text-muted-foreground">This widget (“{type}”) needs a newer version of Folio.</p>
      <Button variant="ghost-destructive" size="icon" aria-label="Remove widget" tooltip="Remove widget" disabled={!canEdit} onClick={onRemove}><Trash /></Button>
    </section>
  )
}
