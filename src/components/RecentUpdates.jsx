import { ArrowUp, ArrowDown, ClockCounterClockwise, WifiSlash, Warning } from '@phosphor-icons/react'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import PageLayout from './PageLayout.jsx'
import FileIcon from './FileIcon.jsx'
import Loading from './Loading.jsx'
import { Tip } from './ui/tooltip.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Button } from './ui/button.jsx'
import { Separator } from './ui/separator.jsx'
import { PAGE } from '../lib/pages.js'
import { shownCommits, whenLabel, unsyncedFiles } from '../lib/history.js'
import { plural } from '../lib/plural.js'
import { displayName } from '../lib/files.js'
import { useHistory } from '../hooks/useHistory.js'
import { cn } from '@/lib/utils.js'

// An update's title: how many files it changed (their names are listed under it)
const updated = count => `Updated ${plural(count, 'file')}`

const STATUS = { added: 'Added', modified: 'Changed', removed: 'Removed', renamed: 'Renamed', archived: 'Removed', copied: 'Copied', changed: 'Changed' }

// Page of what changed lately (Recent updates, under File manager), one update after another with a line between: first
// what changed on this device and isn't synced yet (`changes`, lib/changes.js; "Not synced yet" on its right), then
// GitHub's commits, newest first (`useHistory`): each with an ↑ when this device pushed it, else an ↓ (another device,
// or GitHub itself), "Updated 3 files" and, on the right, when ("Today, 13:32", "Jun 13, 14:39"), and the files it
// changed, each saying how (Added in green, Changed in amber, Removed in red, Renamed); a file or folder that's still there opens (`onOpen(path,
// folder)`), a removed one only shows. The app's own settings (`.folio/`) aren't listed. Offline, what was loaded before.
export default function RecentUpdates({ repo, remote, online, changes, files, onOpen }) {
  const history = useHistory(repo, remote?.branch, remote?.commitSha, online)
  const unsynced = unsyncedFiles(changes)
  const commits = shownCommits(history.commits ?? [])
  const folders = new Set(Object.keys(files).flatMap(p => p.split('/').slice(0, -1).map((_, i, parts) => parts.slice(0, i + 1).join('/'))))
  const exists = f => f.status !== 'removed' && f.status !== 'archived' && (f.folder ? folders.has(f.path) : f.path in files)

  const fileRows = list => (
    <ul className="flex flex-col gap-0.5">
      {list.map(f => (
        <li key={`${f.status}:${f.path}`}>
          <ListRow
            icon={<FileIcon path={f.path} dir={f.folder} />} title={displayName(f.path)}
            description={f.from ? `from ${f.from}` : f.path.includes('/') ? f.path.slice(0, f.path.lastIndexOf('/')) : undefined}
            dimmed={!exists(f)} disabled={!exists(f)} onClick={() => onOpen(f.path, f.folder)}
            trailing={<span className={cn('px-space-sm text-sm @min-[40rem]:text-base', f.status === 'added' ? 'text-success-ink' : f.status === 'removed' || f.status === 'archived' ? 'text-destructive-ink' : f.status === 'modified' || f.status === 'changed' ? 'text-warning-ink' : 'text-muted-foreground')}>{STATUS[f.status] ?? f.status}</span>}
          />
        </li>
      ))}
    </ul>
  )
  return (
    <PageLayout>
      <Surface title={<TitleBar page={PAGE.HISTORY} />}>
        <div className="flex-1 min-h-0 overflow-y-auto" data-no-pull>
          <div className="flex flex-col gap-space p-space">
            {history.status === 'offline' && <Notice icon={WifiSlash}>Offline. {history.commits?.length ? 'Showing what was loaded before.' : 'Connect to the internet to see the updates.'}</Notice>}
            {history.status === 'failed' && <Notice icon={Warning} action={<Button variant="secondary" onClick={history.retry}>Try again</Button>}>Couldn't load the updates from GitHub.</Notice>}

            {unsynced.length > 0 && (
              <section className="flex flex-col">
                <CommitTitle icon={ArrowUp} tip="Made on this device, waiting for Sync" quiet message={updated(unsynced.length)} time="Not synced yet" />
                {fileRows(unsynced)}
              </section>
            )}

            {history.commits === null || (history.status === 'loading' && !commits.length) ? <Loading rows={6} />
              : !commits.length ? (history.status === 'idle' && !unsynced.length && (
                <div className="flex flex-col items-center gap-space-sm py-12 text-muted-foreground">
                  <ClockCounterClockwise className="size-8" />
                  <p className="text-sm">No updates yet.</p>
                </div>
              )) : commits.map((c, i) => (
                <section key={c.sha} className="flex flex-col gap-space">
                  {(i > 0 || unsynced.length > 0) && <Separator />}
                  <div className="flex flex-col">
                    <CommitTitle
                      icon={c.mine ? ArrowUp : ArrowDown} tip={c.mine ? 'Synced from this device' : 'From another device or GitHub'}
                      message={updated(c.files.length)} time={whenLabel(c.date)}
                    />
                    {fileRows(c.files)}
                  </div>
                </section>
              ))}

            {history.hasMore && commits.length > 0 && online && (
              <Button variant="secondary" className="self-center" disabled={history.status === 'more'} onClick={history.more}>
                {history.status === 'more' ? 'Loading…' : 'Show more'}
              </Button>
            )}
          </div>
        </div>
      </Surface>
    </PageLayout>
  )
}

// A commit's line above its files, a small muted title like the rail's Views, as tall as a row: ↑ (this device's,
// accent) or ↓, its title (`message`), and its time on the right, in line with the files' Added / Changed…
function CommitTitle({ icon: Icon, tip, message, time, quiet }) {
  return (
    <div className="flex min-h-control min-w-0 items-center gap-space-sm pl-3 pr-space text-xs font-medium text-muted-foreground">
      <Tip content={tip}>
        <span className={cn('flex shrink-0', Icon === ArrowUp && !quiet ? 'text-primary' : 'text-muted-foreground')} aria-label={tip} role="img"><Icon className="size-4" /></span>
      </Tip>
      <span className="min-w-0 flex-1 truncate">{message}</span>
      {time && <span className="shrink-0 tabular-nums">{time}</span>}
    </div>
  )
}

// A line saying why the list may be out of date, with what to do
function Notice({ icon: Icon, children, action }) {
  return (
    <div className="flex items-center gap-space-sm rounded-sm bg-secondary/60 px-3 py-space-sm text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0" /> <span className="flex-1">{children}</span> {action}
    </div>
  )
}
