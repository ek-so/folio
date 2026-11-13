import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import { PAGE } from '../lib/pages.js'
import { WIDGET_TYPES } from '../widgets/index.js'
import { KEEP_DAYS } from '../lib/archive.js'
import PageLayout from './PageLayout.jsx'

// What each kind of widget (widgets/index.js) does, in plain words, by its `type`: the gist, not step-by-step use.
// The page lists every registered kind with its own label and icon, so a new widget shows up here
// (with a line to write) and none can be forgotten.
const WIDGET_DOCS = {
  board: {
    summary: 'Your notes as cards in columns, like a to-do board.',
    points: [
      'Shows the notes of a folder you pick, subfolders too.',
      'Columns come from one property, status by default. Dragging a card to another column changes it in the note; the file stays where it is.',
      'Adds an empty status and description to notes that lack them.',
      'Removing the board keeps every note.',
    ],
  },
  planner: {
    summary: 'Your notes on a ribbon of days, like a calendar.',
    points: [
      'Shows the notes of a folder you pick on the day in their date. Undated and overdue ones show under today.',
      'Adds an empty date, repeat and description to notes that lack them.',
      'A day\'s cards are sorted by time, title or any property. Drag one into place to sort by hand.',
      'A card can repeat. Mark as done moves it to its next date, or archives a one-time card.',
      'A list view groups every task by time: Today, Tomorrow, This week and later.',
      'Removing the planner keeps every note.',
    ],
  },
  pinned: {
    summary: 'Notes and folders you use often, as cards on the view.',
    points: [
      'A note shows its title and description; a folder how much it holds. A tap opens it.',
      'Drag cards into any order.',
      'Removing a card from the widget, or the widget itself, keeps the note or folder.',
    ],
  },
}

// A page of documentation: how views and each kind of widget work.
export default function Documentation() {
  return (
    <PageLayout>
      <Surface title={<TitleBar page={PAGE.DOCS} />}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto flex max-w-2xl flex-col gap-space-lg p-space">
            <section className="flex flex-col gap-space-sm">
              <h2 className="text-lg font-bold">Views and widgets</h2>
              <p className="text-sm">A view is a page of widgets. Each widget shows some of your notes in its own way.</p>
              <ul className="flex list-disc flex-col gap-space-xs pl-5 text-sm">
                <li>Add a widget with +. Reorder or remove them in the view's ⋯.</li>
                <li>Your notes hold the content. Views and widgets are saved in .folio and only change how notes look, so deleting them never deletes a note.</li>
                <li>A trash removes. A file or folder goes to the archive (.archive) first, where you can recover it for {KEEP_DAYS} days; a value or property is removed for good; a widget, view or date is only taken off, and what it points to stays.</li>
                <li>Changes stay on this device until you Sync.</li>
              </ul>
            </section>
            {WIDGET_TYPES.map(({ type, label, icon: Icon }) => {
              const doc = WIDGET_DOCS[type]
              return (
                <section key={type} className="flex flex-col gap-space-sm">
                  <h2 className="flex items-center gap-space-sm text-lg font-bold"><Icon className="size-5 text-primary" /> {label}</h2>
                  {doc ? (
                    <>
                      <p className="text-sm">{doc.summary}</p>
                      <ul className="flex list-disc flex-col gap-space-xs pl-5 text-sm">{doc.points.map(point => <li key={point}>{point}</li>)}</ul>
                    </>
                  ) : <p className="text-sm text-muted-foreground">No description yet.</p>}
                </section>
              )
            })}
          </div>
        </div>
      </Surface>
    </PageLayout>
  )
}
