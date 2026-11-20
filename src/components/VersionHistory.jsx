import { useEffect, useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, WifiSlash, Warning, ArrowCounterClockwise } from '@phosphor-icons/react'
import BottomSheet from './BottomSheet.jsx'
import MarkdownPreview from './MarkdownPreview.jsx'
import PropertyBadges from './PropertyBadges.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import Loading from './Loading.jsx'
import { Direction, Notice } from './UpdateParts.jsx'
import { EmptyMessage, EMPTY } from './EmptyState.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Badge } from './ui/badge.jsx'
import { Button } from './ui/button.jsx'
import { useFileHistory } from '../hooks/useFileHistory.js'
import { whenLabel } from '../lib/history.js'
import { diffNote } from '../lib/versions.js'
import { frontMatter } from '../lib/frontmatter.js'
import { displayName } from '../lib/files.js'
import { isNetworkError } from '../lib/github.js'

// A note's versions (⋯ › Version history), in a sheet: first its changes not synced yet ("Not synced yet", when it has
// some: `localText`), then each update on GitHub that changed it, newest first (`useFileHistory`, its renames followed
// back), with ↑ (synced from this device) or ↓, when, and how (Created, Changed, Renamed from …; "as name" when it had
// another name then). The newest is Current. Choosing one shows it in the same sheet, ← back to the list: the note as
// it was, what changed from the one before colored (lib/versions.js `diffNote`: added green, removed red and struck
// through; changed properties named on top), and Restore (none on Current; not on a locked note), confirmed, which
// puts the note's text and name back to that version's through `onRestore(version, text)`. `path`: the note's path
// now, `githubPath` its path on GitHub (null: not there yet).
export default function VersionHistory({ repo, path, githubPath, remote, online, files, localText, locked, onRestore, onClose }) {
  const history = useFileHistory(repo, githubPath, remote?.branch, remote?.commitSha, online)
  const local = localText !== undefined
  const entries = useMemo(() => [
    ...(local ? [{ local: true, path }] : []),
    ...(history.versions ?? []),
  ], [local, path, history.versions])
  const [open, setOpen] = useState(null) // the entry shown
  const [shown, setShown] = useState(null) // { text, before } of the open entry, or { error }
  const [restoring, setRestoring] = useState(false)
  const [attempt, setAttempt] = useState(0) // Try again: the open entry loaded anew

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setShown(null)
    const at = history.versions?.indexOf(open) ?? -1
    const load = open.local
      ? Promise.all([localText, history.versions?.[0] ? history.textOf(history.versions[0]) : ''])
      : Promise.all([history.textOf(open), history.textBefore(at)])
    load.then(([text, before]) => { if (!cancelled) setShown({ text, before }) })
      .catch(e => { if (!cancelled) setShown({ error: isNetworkError(e) ? 'offline' : 'failed' }) })
    return () => { cancelled = true }
  }, [open, attempt])

  const diff = useMemo(() => shown?.text !== undefined ? diffNote(shown.before, shown.text) : null, [shown])
  const label = e => e.local ? 'Not synced yet' : whenLabel(e.date)
  const describe = e => [
    e.local ? 'Changed on this device' : e.status === 'added' ? 'Created' : e.status === 'renamed' ? `Renamed from ${displayName(e.from)}` : 'Changed',
    e.path !== path && `as ${displayName(e.path)}`,
  ].filter(Boolean).join(' · ')
  const current = entries[0]

  if (open) return (
    <BottomSheet title={label(open)} description={describe(open)} wide onBack={() => setOpen(null)} onClose={onClose} onOpenAutoFocus={e => e.preventDefault()}>
      {!shown ? <Loading kind="text" /> : shown.error ? (
        <Notice icon={shown.error === 'offline' ? WifiSlash : Warning} action={<Button variant="secondary" onClick={() => setAttempt(n => n + 1)}>Try again</Button>}>
          {shown.error === 'offline' ? "Offline: this version isn't on this device yet." : "Couldn't load this version from GitHub."}
        </Notice>
      ) : <>
        {diff.props.length > 0 && <p className="text-sm text-muted-foreground">Properties changed: {diff.props.join(', ')}</p>}
        <div className="-mx-space-lg flex h-[55dvh] flex-col border-y border-border">
          <MarkdownPreview content={diff.text} marks={diff.marks} path={open.path} files={files}>
            {(frontMatter(diff.text)?.props.length ?? 0) > 0 && <PropertyBadges props={frontMatter(diff.text).props} path={open.path} files={files} title="Properties" className="px-space pt-space" />}
          </MarkdownPreview>
        </div>
        {open !== current && (
          <div className="flex justify-end">
            <Button disabled={locked} tooltip={locked ? 'The note is locked' : undefined} onClick={() => setRestoring(true)}>
              <ArrowCounterClockwise /> Restore
            </Button>
          </div>
        )}
        {restoring && (
          <ConfirmModal
            title="Restore this version?"
            description={`The note goes back to how it was ${open.local ? 'on this device' : `on ${whenLabel(open.date)}`}${open.path !== path ? `, named ${displayName(open.path)}` : ''}.${local ? ' Its changes not synced yet are replaced.' : ''} Its history stays: the restore goes to GitHub with the next sync, and can itself be undone from here.`}
            confirm="Restore" safe={!local}
            onConfirm={() => { setRestoring(false); onRestore(open, shown.text) }}
            onClose={() => setRestoring(false)}
          />
        )}
      </>}
    </BottomSheet>
  )

  return (
    <BottomSheet title="Version history" description={displayName(path)} onClose={onClose} onOpenAutoFocus={e => e.preventDefault()}>
      <div className="-mx-space-xs flex max-h-[60dvh] flex-col gap-space-sm overflow-y-auto" data-no-pull>
        {history.status === 'offline' && <Notice icon={WifiSlash}>Offline. {history.versions?.length ? 'Showing what was loaded before.' : 'Connect to the internet to see the versions.'}</Notice>}
        {history.status === 'failed' && <Notice icon={Warning} action={<Button variant="secondary" onClick={history.retry}>Try again</Button>}>Couldn't load the versions from GitHub.</Notice>}
        {history.versions === null || (history.status === 'loading' && !entries.length) ? <Loading rows={4} />
          : !entries.length ? (history.status === 'idle' && <EmptyMessage size="sm" emoji={EMPTY.updates}>No versions yet.</EmptyMessage>)
          : (
            <ul className="flex flex-col gap-0.5">
              {entries.map(e => (
                <li key={e.local ? 'local' : e.sha}>
                  <ListRow
                    icon={e.local ? <Direction icon={ArrowUp} tip="Made on this device, waiting for Sync" quiet />
                      : <Direction icon={e.mine ? ArrowUp : ArrowDown} tip={e.mine ? 'Synced from this device' : 'From another device or GitHub'} />}
                    title={label(e)} description={describe(e)} onClick={() => setOpen(e)}
                    trailing={e === current && <Badge className="mr-space-sm">Current</Badge>}
                  />
                </li>
              ))}
            </ul>
          )}
        {history.hasMore && online && (
          <Button variant="secondary" className="self-center" disabled={history.status === 'more'} onClick={history.more}>
            {history.status === 'more' ? 'Loading…' : 'Show more'}
          </Button>
        )}
      </div>
    </BottomSheet>
  )
}
