import { useEffect } from 'react'
import { X } from '@phosphor-icons/react'
import { EmptyMessage, EMPTY } from './EmptyState.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import PageLayout from './PageLayout.jsx'
import FileIcon from './FileIcon.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Button } from './ui/button.jsx'
import { PAGE } from '../lib/pages.js'
import { dateLabel } from '../lib/dates.js'

// Notifications: every reminder that has come due (useReminderAlerts' `due`, latest first), each a row with its note's
// icon and title, and which date it's for and when (`due · 25 Nov, 09:30`); a tap opens the note (`onOpen(path)`), its ✕
// dismisses it (`onDismiss(id)`: off the list on this device; the reminder stays in the note), Clear all in the title
// bar dismisses them all. Being open counts them as seen (`onSeen`: the nav's count goes), as new ones come due too.
export default function Notifications({ due, onOpen, onDismiss, onDismissAll, onSeen }) {
  useEffect(() => { onSeen() }, [due.length])
  return (
    <PageLayout>
      <Surface title={<TitleBar page={PAGE.NOTIFICATIONS}>{due.length > 0 && <Button variant="ghost" onClick={onDismissAll}>Clear all</Button>}</TitleBar>}>
        <div className="flex-1 min-h-0 overflow-y-auto" data-no-pull>
          {due.length === 0 ? (
            <EmptyMessage size="lg" emoji={EMPTY.reminders}>No reminders yet</EmptyMessage>
          ) : (
            <ul className="flex flex-col gap-0.5 p-space">
              {due.map(r => (
                <li key={r.id}>
                  <ListRow
                    icon={<FileIcon path={r.path} />} title={r.title} description={`${r.key} · ${dateLabel(r.date)}`}
                    onClick={() => onOpen(r.path)}
                    trailing={<Button variant="ghost-destructive" size="icon-md" aria-label={`Dismiss ${r.title}`} tooltip="Dismiss" onClick={() => onDismiss(r.id)}><X /></Button>}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Surface>
    </PageLayout>
  )
}
