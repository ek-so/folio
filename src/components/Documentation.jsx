import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import { PAGE } from '../lib/pages.js'
import { WIDGET_TYPES } from '../widgets/index.js'

// What each kind of widget (widgets/index.js) is for and how it works, in plain words, by its `type`.
// The page lists every registered kind with its own label and icon, so a new widget shows up here
// (with a line to write) and none can be forgotten.
const WIDGET_DOCS = {
  board: {
    summary: 'Your notes as cards in columns, like a to-do board.',
    points: [
      'Takes every note in the folder you pick, subfolders too. Files starting with . or _ are skipped.',
      'Columns come from one property, status by default. Each value is a column; notes without one go to "No status". Pick another property in ⋯ → Columns → Group by.',
      'Drag a card to another column and its status changes in the note. The file doesn\'t move.',
      'Adds an empty status and description to notes that lack them. Showing another property on cards adds it, empty, the same way. The property the columns come from comes back if you delete it in a note.',
      'Cards show the title, description, chosen properties and checklist progress. Tap a value to change it.',
      'Column order, hidden columns and shown properties are just display settings. Removing the board keeps every note.',
    ],
  },
  planner: {
    summary: 'Your notes on a ribbon of days, like a calendar.',
    points: [
      'Takes every note in the folder you pick, subfolders too. Each card sits on the day in its date property.',
      'Adds an empty date, type and description to notes that lack them. Date and type always show on cards and come back if you delete them in a note.',
      'Type says how often a card happens: one-time, or repeating every few days, weeks (on chosen weekdays), months or years, until a day if you like. Tap it to choose. A repeating card shows on every day it happens.',
      'Tap a day to see its cards, or jump to any day with the calendar on the right and back with Today. Notes with no date or a past date also show under today, dashed.',
      'Drag a card onto a day, or tap its date, to move it. New card uses the selected day.',
      'Removing the planner keeps every note.',
    ],
  },
  note: {
    summary: 'A few notes side by side, to read and edit right on the view.',
    points: [
      'Pick any notes in the repo, or create a new one. Nothing is added to them.',
      'Edits save on their own, ticking a checkbox too.',
      'Removing a note from the widget, or the widget itself, keeps the note.',
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
              <p className="text-sm">A view is a page of widgets. Each widget shows some of your notes in its own way.</p>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
                <li>Add a widget with +. Reorder or remove them in the view's ⋯.</li>
                <li>Your notes hold the content. Views and widgets are saved in .folio and only change how notes look, so deleting them never deletes a note.</li>
                <li>A trash deletes for good. A ✕ only takes something off a view.</li>
                <li>Changes stay on this device until you Sync.</li>
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
