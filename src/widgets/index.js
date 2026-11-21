import board from './board/index.js'
import pinned from './pinned/index.js'
import planner from './planner/index.js'
import note from './note/index.js'

// Every kind of widget a view can hold, by its `type` in .folio/views.json.
// A widget is self-contained in its own folder and is one object:
//   type, label, icon         what Add widget lists
//   Widget                    ({ id, services, onRemove }): the widget on its view
//   title(id, services)        optional: its name in Edit widgets (else its label)
//   named: false               optional: its name is always `title`'s, never its own (a Note widget: its note's)
//   Setup                     ({ services, onCreate, onClose }): asks what's needed before it exists, then
//                             onCreate(id => change) with the changes that set it up (ch => ch)
//   moved(ch, id, from, to, isDir, services)  `ch` after a file or folder moved (renames and moves anywhere)
//   removed(ch, id, services)                 `ch` after the widget is removed (its settings go)
//   tree(id, services)                        optional: what it shows, for the title bar's view tree: nodes
//                                             { key, name, icon (Phosphor) or path (a note; with `dir`, a folder), children? } (NavTree.jsx)
//   fileMoves(id, path, services)             optional: for the file open on this widget's view, the columns it can move
//                                             to ({ columns: [{ key, name }], column, onSelect(key) }) or null; the file's ⋯ shows them
// `services` is all a widget gets from the app (App's `widgetServices`): what the repo holds,
// its settings files (`config`) and the app's own ways to change files and open them.
// A view keeps widgets of a kind this version doesn't know; they show as such and can be removed.
export const WIDGET_TYPES = [board, planner, pinned, note]

export const widgetType = type => WIDGET_TYPES.find(w => w.type === type)

// A view's widget's name ({ id, type, name? }): its own (Rename in its ⋯; not a kind that's `named: false`), else its kind's title or label
export function widgetTitle(widget, services) {
  const type = widgetType(widget.type)
  return (type?.named === false ? undefined : widget.name) ?? (type ? type.title?.(widget.id, services) ?? type.label : 'Unknown widget')
}
