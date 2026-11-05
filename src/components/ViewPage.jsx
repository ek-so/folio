import { Plus, Trash } from '@phosphor-icons/react'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import { WIDGET_TYPES, widgetType } from '../widgets/index.js'

// A view (Home…): its title bar with + (Add widget: every kind in widgets/index.js),
// over its widgets ({ id, type }), stacked full width (a dashboard). Each widget is its
// kind's own component, given the app's `services`; `onAdd(type)`, `onRemove(id)`.
// Until the settings are read (`services.canEdit` false) nothing can be added.
export default function ViewPage({ page, widgets = [], services, onAdd, onRemove }) {
  const { canEdit } = services
  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" aria-label="Add widget" title="Add widget" disabled={!canEdit} className="shrink-0">
          <Plus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
        {WIDGET_TYPES.map(t => <DropdownMenuItem key={t.type} onSelect={() => onAdd(t.type)}><t.icon /> {t.label}</DropdownMenuItem>)}
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
              <div className="flex flex-wrap justify-center gap-space-sm">
                {WIDGET_TYPES.map(t => (
                  <Button key={t.type} variant="secondary" disabled={!canEdit} onClick={() => onAdd(t.type)}><t.icon /> Add {t.label.toLowerCase()}</Button>
                ))}
              </div>
            </div>
          ) : widgets.map(w => {
            const type = widgetType(w.type)
            return type
              ? <type.Widget key={w.id} id={w.id} services={services} onRemove={() => onRemove(w.id)} />
              : <UnknownWidget key={w.id} type={w.type} canEdit={canEdit} onRemove={() => onRemove(w.id)} />
          })}
        </div>
      </Surface>
    </PageLayout>
  )
}

// A widget of a kind this version doesn't know (added by a newer one): kept, and it can be removed
function UnknownWidget({ type, canEdit, onRemove }) {
  return (
    <section className="flex items-center gap-space-sm rounded-lg border border-border p-space-sm">
      <p className="min-w-0 flex-1 px-space-xs text-sm text-muted-foreground">This widget (“{type}”) needs a newer version of Folio.</p>
      <Button variant="ghost" size="icon" aria-label="Remove widget" title="Remove widget" disabled={!canEdit} onClick={onRemove}><Trash /></Button>
    </section>
  )
}
