import { useEffect, useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import { EmptyMessage, EMPTY } from './EmptyState.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import PageLayout from './PageLayout.jsx'
import FileIcon from './FileIcon.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Button } from './ui/button.jsx'
import { PAGE } from '../lib/pages.js'
import { plural } from '../lib/plural.js'
import { dateLabel } from '../lib/dates.js'

// Notifications: every reminder that has come due (useReminderAlerts' `due`, latest first), each a row with its note's
// icon and title, and which date it's for and when (`due · 25 Nov, 09:30`); a tap opens the note (`onOpen(path)`), its
// red trash takes it off the list at once (`onDismiss(id)`: on this device; the reminder stays in the note, so nothing's
// lost and nothing asks first), Clear all (red) in the title bar takes them all off, confirmed. Being open
// counts them as seen (`onSeen`: the nav's count goes), as new ones come due too.
export default function Notifications({ due, onOpen, onDismiss, onDismissAll, onSeen }) {
  const [clearing, setClearing] = useState(false)
  useEffect(() => { onSeen() }, [due.length])
  return (
    <PageLayout>
      <Surface title={(
        <TitleBar page={PAGE.NOTIFICATIONS}>
          {due.length > 0 && <Button variant="ghost-destructive" onClick={() => setClearing(true)}>Clear all</Button>}
        </TitleBar>
      )}>
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
                    trailing={<Button variant="ghost-destructive" size="icon-md" aria-label={`Remove ${r.title}`} tooltip="Remove" onClick={() => onDismiss(r.id)}><Trash /></Button>}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Surface>
      {clearing && (
        <ConfirmModal
          title="Clear all notifications?"
          description={`${plural(due.length, 'reminder')} come${due.length === 1 ? 's' : ''} off this list on this device. The reminders stay in their notes.`}
          confirm="Clear all"
          onConfirm={() => { setClearing(false); onDismissAll() }}
          onClose={() => setClearing(false)}
        />
      )}
    </PageLayout>
  )
}
