import { useState } from 'react'
import { Copy } from '@phosphor-icons/react'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import { PAGE } from '../lib/pages.js'
import { WIDGET_TYPES } from '../widgets/index.js'
import { KEEP_DAYS } from '../lib/archive.js'
import PageLayout from './PageLayout.jsx'
import { Segmented } from './ui/segmented.jsx'
import { Button } from './ui/button.jsx'
import { copyText } from '../lib/clipboard.js'

// The markdown a note can hold (GitHub Flavored Markdown, as lib/markdown.js renders it): [name, syntax].
// The syntax is shown as it is and copied as it is, ready to paste and fill in.
const MARKDOWN_DOCS = [
  ['Heading 1', '# Heading'],
  ['Heading 2', '## Heading'],
  ['Heading 3', '### Heading'],
  ['Bold', '**text**'],
  ['Italic', '*text*'],
  ['Bold and italic', '***text***'],
  ['Strikethrough', '~~text~~'],
  ['Inline code', '`code`'],
  ['Code block', '```\ncode\n```'],
  ['Link', '[text](https://example.com)'],
  ['Image', '![description](image.png)'],
  ['Quote', '> text'],
  ['Note callout', '> [!NOTE]\n> text'],
  ['Tip callout', '> [!TIP]\n> text'],
  ['Important callout', '> [!IMPORTANT]\n> text'],
  ['Warning callout', '> [!WARNING]\n> text'],
  ['Caution callout', '> [!CAUTION]\n> text'],
  ['Bulleted list', '- item\n- item'],
  ['Numbered list', '1. item\n2. item'],
  ['Task list', '- [ ] task\n- [x] done'],
  ['Table', '| Column | Column |\n| --- | --- |\n| text | text |'],
  ['Divider', '---'],
]

const TABS = [['markdown', 'Markdown'], ['app', 'Application']]

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
  'single-note': {
    summary: 'One note shown on the view, named after it.',
    points: [
      'Shows the note\'s text in a card; a long note fades out at the bottom.',
      'Links and checkboxes work right in the card.',
      'A tap opens the note; a double tap opens it for editing.',
      'Select note… in ⋯ shows another one. Removing the widget keeps the note.',
    ],
  },
}

// A page of documentation in two tabs: the markdown a note can hold, and how views and each kind of widget work.
export default function Documentation() {
  const [tab, setTab] = useState('markdown')
  return (
    <PageLayout>
      <Surface title={<TitleBar page={PAGE.DOCS} />}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto flex max-w-2xl flex-col gap-space-lg p-space">
            <Segmented stretch value={tab} onChange={setTab} options={TABS} label="Documentation" />
            {tab === 'markdown' ? <MarkdownDocs /> : <AppDocs />}
          </div>
        </div>
      </Surface>
    </PageLayout>
  )
}

// Each piece of markdown with its syntax and a button copying it
function MarkdownDocs() {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-space-sm pr-space font-medium">Element</th>
          <th className="py-space-sm pr-space font-medium">Syntax</th>
          <th><span className="sr-only">Copy</span></th>
        </tr>
      </thead>
      <tbody>
        {MARKDOWN_DOCS.map(([name, syntax]) => (
          <tr key={name} className="border-b border-border">
            <td className="py-space-sm pr-space align-middle">{name}</td>
            <td className="py-space-sm pr-space align-middle"><code className="code-chunk inline-block whitespace-pre-wrap break-all">{syntax}</code></td>
            <td className="py-space-sm text-right align-middle">
              <Button variant="ghost" size="icon" tooltip="Copy" aria-label={`Copy ${name}`} onClick={() => copyText(syntax, 'Copied')}><Copy /></Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// How views and each kind of widget work
function AppDocs() {
  return (
    <>
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
    </>
  )
}
