import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import { PAGE } from '../lib/pages.js'
import { WIDGET_TYPES } from '../widgets/index.js'

// What each kind of widget (widgets/index.js) is for and how it works, in plain words, by its `type`.
// The page lists every registered kind with its own label and icon, so a new widget shows up here
// (with a line to write) and none can be forgotten.
const WIDGET_DOCS = {
  board: {
    summary: 'A Kanban board over a folder: its subfolders are the columns and the notes in them are the cards.',
    points: [
      'Pick the folder when you add it. Notes right in that folder wait in a "No status" column that shows only while it has cards. Technical files and folders (a name starting with . or _) stay off the board.',
      'Drag a card to another column and its file moves into that column\'s folder. Drag a column by its title to reorder it. The order is saved.',
      'A card shows the note\'s title, its description, the properties you chose and a progress bar when the note has a checklist. Tap it to open the note.',
      'Click a badge on a card to choose another value or add a new one. In the popover, Edit values renames a value, gives it a color or removes it from every card.',
      'A card\'s ⋯: Edit title (the file keeps its name), description, Rename file, Duplicate, Copy link, Move to column and Remove.',
      'The board\'s ⋯: Columns (show or hide them, open a column\'s folder, add or remove one), Properties (pick which ones show; rename or remove one in every note) and Remove board. Removing the board keeps its notes.',
      'New card under a column asks for a title and a file name, then creates the note in that column.',
    ],
  },
  planner: {
    summary: 'A ribbon of days with the cards of the selected day under it. Each note in the folder is a card on the day of its date property.',
    points: [
      'Pick the folder when you add it. Every note in it, at any depth, gets an empty date and description property.',
      'The ribbon scrolls sideways without end. Today has a ring, the selected day is filled, and a day with cards shows how many. The month is named above its days. The Today button jumps back.',
      'Under the ribbon: the selected day\'s cards in a box like a board column, by time and then title. It shows the first seven; Show more shows the rest. Cards without a date always show under today, with a dashed outline and "No date" on the date badge until you pick one. Cards dated before today show there too, also dashed, and also on their own day.',
      'To change a card\'s day, drag it onto a day in the ribbon, or click its date badge and pick a day in the calendar. A time stays when you drag.',
      'New card under the list creates a note in the folder with the selected day as its date.',
      'The planner\'s ⋯: Properties (the date is always shown and locked; pick the others) and Remove planner. Removing the planner keeps its notes.',
    ],
  },
  note: {
    summary: 'Notes from anywhere in the repo, side by side on a view, to read and edit in place.',
    points: [
      'Add note… finds an existing note by its path, or creates a new one in a folder you pick. A note already in the widget isn\'t added twice.',
      'Each note sits in its own box with its name, Edit (tick when done) and a ⋯: Open full screen, Rename note, and Remove from widget (the note stays).',
      'Edits save on their own, and ticking a checkbox in the preview edits the note too.',
      'On a wide screen the boxes share one height. Drag the handle under them to resize all of them; double click it to reset.',
      'Edit notes… puts them in order and takes them out. Remove widget keeps the notes.',
    ],
  },
}

// A page of documentation: how views and each kind of widget work.
export default function Documentation() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Surface title={<TitleBar page={PAGE.DOCS} />}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto flex max-w-2xl flex-col gap-space-lg p-space">
            <section className="flex flex-col gap-space-sm">
              <h2 className="text-lg font-bold">Views and widgets</h2>
              <p className="text-sm">A view is a dashboard in the navigation (Home, or any you add with Add view). It stacks widgets, each one showing some of your notes in its own way.</p>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
                <li>Add a widget with + in the view's title bar. The view's ⋯ has Edit widgets (drag to reorder, ✕ to take one off), Rename and Remove.</li>
                <li>Widgets and views are saved in the repo's .folio folder, so they sync like notes.</li>
                <li>A trash means a note, folder or value is deleted. A ✕ only takes something off a view or a widget; the notes stay.</li>
                <li>Everything you change is a local change until you Sync.</li>
              </ul>
            </section>
            {WIDGET_TYPES.map(({ type, label, icon: Icon }) => {
              const doc = WIDGET_DOCS[type]
              return (
                <section key={type} className="flex flex-col gap-space-sm">
                  <h2 className="flex items-center gap-2 text-lg font-bold"><Icon className="size-5 text-primary" /> {label}</h2>
                  {doc ? (
                    <>
                      <p className="text-sm">{doc.summary}</p>
                      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">{doc.points.map(point => <li key={point}>{point}</li>)}</ul>
                    </>
                  ) : <p className="text-sm text-muted-foreground">No description yet.</p>}
                </section>
              )
            })}
          </div>
        </div>
      </Surface>
    </div>
  )
}
