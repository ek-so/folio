import { useState } from 'react'
import { placesOf } from '../lib/url.js'
import { widgetType } from '../widgets/index.js'

// Where each widget is (a planner's view and day: { widget id: place }, its kind's own text), kept in the address of its
// view's own content (lib/url.js `at`), so a change is a step Back and Forward go through. `views`: the views and their
// widgets. `placeOf(id)`: its place, or where its kind says it starts (`place(id)` in widgets/<kind>) until it has one;
// `placesOn(page, view)`: the places of the widgets on that page's own content (none when a file or folder is open:
// `view`); `setPlace(id, place)`; `setPlaces` for Back and Forward (useAddressBar). Starts with the ones the address
// names.
export function useWidgetPlaces(views) {
  const [places, setPlaces] = useState(() => placesOf(window.location.search))
  const widgets = views.flatMap(v => v.widgets ?? [])
  const placeOf = id => places[id] ?? widgetType(widgets.find(w => w.id === id)?.type)?.place?.(id) ?? null
  const placesOn = (page, view) => view ? {} : Object.fromEntries((views.find(v => v.id === page)?.widgets ?? []).map(w => [w.id, placeOf(w.id)]).filter(([, p]) => p))
  return { placeOf, placesOn, setPlaces, setPlace: (id, place) => setPlaces(o => ({ ...o, [id]: place })) }
}
