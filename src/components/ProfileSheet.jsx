import { useState, useRef } from 'react'
import { SignOut, GithubLogo, BookBookmark, CaretRight, GitBranch, ArrowSquareOut, Gear, Sun, Moon, Monitor } from '@phosphor-icons/react'
import { Segmented } from './ui/segmented.jsx'
import { useNotifyPermission } from '../hooks/useReminderAlerts.js'
import { plural } from '../lib/plural.js'
import { Radio } from './ui/checkbox.jsx'
import RepoForm from './RepoForm.jsx'
import BottomSheet, { SheetActions } from './BottomSheet.jsx'
import { Button } from './ui/button.jsx'
import { Label } from './ui/label.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Separator } from './ui/separator.jsx'
import { focusQuietly } from '@/lib/utils.js'

// Profile (the rail's and the phone menu's last item, in Sign out's old place): a sheet (a dialog on a computer) with who's
// signed in (GitHub) and Sign out (red; App confirms it). The repository (`repo`) it's
// signed in to, as a row that steps (←) to the repos used on this device (`repos`, the open one chosen; another one opens
// the app there, `onSwitchRepo(full)`), Switch to another repository… (its owner/repo field, a step of its own) and Open
// on GitHub, as File manager's root menu (RepoMenu) has them; switching waits while a sync runs (`syncing`). `onBack`: its
// ← back to the sheet it was opened from (the phone's menu); none from the rail. Settings (a step, ←): the theme
// (`theme`, `onTheme`) and the emoji in names (`emojiNames`, { count, onMove }, null while icons can't be saved: how many
// files and folders start their name with an emoji; Move to icons, confirmed in a step of its own, takes it out of their
// names and makes it their icon, lib/icons.js) and Notifications (whether this browser lets Folio notify, with Turn on).
const THEMES = [['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]]

export default function ProfileSheet({ login, repo, repos = [], syncing, onSwitchRepo, theme, onTheme, emojiNames, onSignOut, onBack, onClose }) {
  const notify = useNotifyPermission()
  const inputRef = useRef()
  const [step, setStep] = useState('main')

  const toMain = () => setStep('main')

  if (step === 'repo') return (
    <BottomSheet title="Repository" description="The repo your notes are in." onBack={toMain} onClose={onClose} onOpenAutoFocus={e => e.preventDefault()}>
      <ul className="-mx-space-xs" role="radiogroup" aria-label="Repositories used on this device">
        {repos.map(r => (
          <li key={r}>
            <ListRow icon={<Radio checked={r === repo} />} title={<span className="font-mono text-sm">{r}</span>} disabled={syncing && r !== repo} onClick={() => r !== repo && onSwitchRepo(r)} />
          </li>
        ))}
      </ul>
      <Separator className="my-space-xs" />
      <ul className="-mx-space-xs">
        <li><ListRow icon={<GitBranch />} title="Switch to another repository…" disabled={syncing} onClick={() => setStep('switch')} /></li>
        <li><ListRow icon={<ArrowSquareOut />} title="Open on GitHub" onClick={() => window.open(`https://github.com/${repo}`, '_blank', 'noopener,noreferrer')} /></li>
      </ul>
    </BottomSheet>
  )

  if (step === 'switch') return (
    <BottomSheet
      title="Switch repository" description="Unsynced changes stay on this device with their repo."
      onBack={() => setStep('repo')} onClose={onClose}
      onOpenAutoFocus={e => { e.preventDefault(); focusQuietly(inputRef.current, true) }}
    >
      <RepoForm
        initial={repo} onConnect={onSwitchRepo} inputRef={inputRef} inputClassName="font-mono"
        actions={({ busy, empty }) => (
          <SheetActions>
            <Button type="button" variant="secondary" onClick={() => setStep('repo')}>Cancel</Button>
            <Button type="submit" disabled={busy || empty || syncing}>{busy ? 'Checking…' : syncing ? 'Syncing…' : 'Switch'}</Button>
          </SheetActions>
        )}
      />
    </BottomSheet>
  )

  if (step === 'settings') return (
    <BottomSheet title="Settings" onBack={toMain} onClose={onClose} onOpenAutoFocus={e => e.preventDefault()}>
      <div className="flex flex-col gap-space">
        <div className="flex flex-col gap-space-sm">
          <Label>Theme</Label>
          <Segmented stretch value={theme} onChange={onTheme} options={THEMES} label="Theme" />
        </div>
        <Separator />
        <div className="flex flex-col items-start gap-space-sm">
          <Label>Notifications</Label>
          <p className="text-sm text-muted-foreground">
            {{
              granted: 'Allowed: reminders show as notifications while Folio is open.',
              denied: 'Blocked in this browser. Allow them in its site settings for this page.',
              default: 'Not on yet: reminders show inside Folio only.',
              install: 'On iPhone and iPad, add Folio to the Home Screen first (Share → Add to Home Screen), then turn them on there.',
              unsupported: 'This browser can\'t show notifications: reminders show inside Folio.',
            }[notify.state]}
          </p>
          {notify.state === 'default' && <Button variant="secondary" onClick={notify.ask}>Turn on</Button>}
        </div>
        {emojiNames && <>
          <Separator />
          <div className="flex flex-col items-start gap-space-sm">
            <Label>Emoji in names</Label>
            <p className="text-sm text-muted-foreground">
              {emojiNames.count
                ? `${plural(emojiNames.count, 'file or folder name')} start${emojiNames.count === 1 ? 's' : ''} with an emoji. Move it out of the name and make it the icon.`
                : 'No file or folder starts its name with an emoji.'}
            </p>
            <Button variant="secondary" disabled={!emojiNames.count} onClick={() => setStep('emoji')}>Move to icons</Button>
          </div>
        </>}
      </div>
    </BottomSheet>
  )

  if (step === 'emoji') return (
    <BottomSheet
      title="Move emojis to icons?"
      description={`${plural(emojiNames.count, 'name')} lose${emojiNames.count === 1 ? 's' : ''} the emoji, which becomes the icon kept in .folio. Files are renamed and every link to them is updated; Sync to apply it on GitHub.`}
      onBack={() => setStep('settings')} onClose={onClose}
    >
      <SheetActions className="flex-wrap">
        <Button variant="secondary" onClick={() => setStep('settings')}>Cancel</Button>
        <Button onClick={() => { emojiNames.onMove(); setStep('settings') }}>Move to icons</Button>
      </SheetActions>
    </BottomSheet>
  )

  return (
    <BottomSheet title="Profile" onBack={onBack} onClose={onClose} onOpenAutoFocus={e => e.preventDefault()}>
      <ul className="-mx-space-xs">
        <li><ListRow icon={<GithubLogo />} title={login} description="Signed in with GitHub" disabled /></li>
        <li><ListRow icon={<BookBookmark />} title={<span className="font-mono text-sm">{repo}</span>} description="Repository" onClick={() => setStep('repo')} trailing={<CaretRight className="mr-space-xs size-4 text-muted-foreground" />} /></li>
      </ul>
      <Separator className="my-space-xs" />
      <ul className="-mx-space-xs">
        <li><ListRow icon={<Gear />} title="Settings" onClick={() => setStep('settings')} trailing={<CaretRight className="mr-space-xs size-4 text-muted-foreground" />} /></li>
      </ul>
      <Separator className="my-space-xs" />
      <ul className="-mx-space-xs">
        <li><ListRow icon={<SignOut className="text-destructive-ink" />} title={<span className="text-destructive-ink">Sign out</span>} onClick={onSignOut} /></li>
      </ul>
    </BottomSheet>
  )
}
