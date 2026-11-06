import { useState } from 'react'
import { Plus, Trash, DotsThree, PencilSimple, ArrowsDownUp } from '@phosphor-icons/react'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import TitleBar from './TitleBar.jsx'
import RearrangeModal from './RearrangeModal.jsx'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu.jsx'
import { WIDGET_TYPES, widgetType } from '../widgets/index.js'

// A view (Home…): its title bar with + (Add widget: every kind in widgets/index.js) and ⋯
// (Rearrange widgets, Rename, Remove; the navigation's ⋯ keeps only Rename and Remove), over its widgets ({ id, type }), stacked full width (a dashboard),
// and Add widget under them. Each widget is its kind's own component, given the app's `services`;
// `onAdd(type)`, `onRemove(id)` (always confirmed first: a widget's own Remove asks here),
// `onMove(from, to)` (Rearrange widgets), `onRename()` and `onRemoveView()` (App's view dialogs).
// Until the settings are read (`services.canEdit` false) nothing can be added.
// `error`: why the views can't be changed (shown on top), or null.
export default function ViewPage({ page, widgets = [], error, services, onAdd, onRemove, onMove, onRename, onRemoveView, canEditView }) {
  const { canEdit } = services
  const [removing, setRemoving] = useState(null) // the widget whose Remove is being confirmed
  const [rearranging, setRearranging] = useState(false)
  const kinds = WIDGET_TYPES.map(t => <DropdownMenuItem key={t.type} onSelect={() => onAdd(t.type)}><t.icon /> {t.label}</DropdownMenuItem>)
  // Add widget: a menu of every kind, from `trigger`
  const addMenu = (trigger, align = 'end') => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} onCloseAutoFocus={e => e.preventDefault()}>{kinds}</DropdownMenuContent>
    </DropdownMenu>
  )
  const viewMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost-outline" size="icon" aria-label="View actions" className="shrink-0 border-muted-foreground/50">
          <DotsThree weight="bold" size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
        <DropdownMenuItem disabled={!canEdit || widgets.length < 2} onSelect={() => setRearranging(true)}><ArrowsDownUp /> Rearrange widgets</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!canEditView} onSelect={onRename}><PencilSimple /> Rename</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" disabled={!canEditView} onSelect={onRemoveView}><Trash /> Remove</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  return (
    <PageLayout>
      <Surface tree wide title={
        <TitleBar page={page}>
          {viewMenu}
          {addMenu(<Button size="icon" aria-label="Add widget" tooltip="Add widget" disabled={!canEdit} className="shrink-0"><Plus /></Button>)}
        </TitleBar>
      }>
        <div className="flex min-h-0 flex-1 flex-col gap-space overflow-y-auto p-space">
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          {widgets.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-space py-12 text-center">
              <p className="text-sm text-muted-foreground">Nothing on this view yet.</p>
              <div className="flex flex-wrap justify-center gap-space-sm">
                {WIDGET_TYPES.map(t => (
                  <Button key={t.type} variant="secondary" disabled={!canEdit} onClick={() => onAdd(t.type)}><t.icon /> Add {t.label.toLowerCase()}</Button>
                ))}
              </div>
            </div>
          ) : <>
            {widgets.map(w => {
              const type = widgetType(w.type)
              return type
                ? <type.Widget key={w.id} id={w.id} services={services} onRemove={() => setRemoving(w)} />
                : <UnknownWidget key={w.id} type={w.type} canEdit={canEdit} onRemove={() => setRemoving(w)} />
            })}
            <div className="flex shrink-0 justify-center">
              {addMenu(<Button variant="secondary" disabled={!canEdit}><Plus /> Add widget</Button>, 'center')}
            </div>
          </>}
        </div>
      </Surface>
      {rearranging && (
        <RearrangeModal
          title="Rearrange widgets"
          description="Drag them into the order they show on this view."
          items={widgets.map(w => {
            const type = widgetType(w.type)
            return { id: w.id, icon: type ? <type.icon /> : null, title: type?.title?.(w.id, services) ?? type?.label ?? w.type }
          })}
          onMove={onMove}
          onClose={() => setRearranging(false)}
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
