import { useState, useRef } from 'react'
import { EnvelopeSimple, PencilSimple, SignOut, GithubLogo, BookBookmark, CaretRight, GitBranch, ArrowSquareOut, Gear, Sun, Moon, Monitor } from '@phosphor-icons/react'
import { Segmented } from './ui/segmented.jsx'
import { useNotifyPermission } from '../hooks/useReminderAlerts.js'
import { SECRET, secretUrl, runsUrl } from '../lib/emailJob.js'
import { plural } from '../lib/plural.js'
import { Radio } from './ui/checkbox.jsx'
import RepoForm from './RepoForm.jsx'
import BottomSheet from './BottomSheet.jsx'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { Label } from './ui/label.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Separator } from './ui/separator.jsx'
import { Placeholder } from './ui/placeholder.jsx'
import { cleanEmail } from '../lib/profile.js'

// Profile (the rail's and the phone menu's last item, in Sign out's old place): a sheet (a dialog on a computer) with who's
// signed in (GitHub), the reminder email (lib/profile.js; Edit steps to its field, ← back) and Sign out (red; App
// confirms it). `start`: 'email' opens it at the email's field (Edit in a date's reminder), its ← going back to the date's sheet.
// `onSaveEmail(text)` (null while the profile can't be saved): '' takes the address out. The repository (`repo`) it's
// signed in to, as a row that steps (←) to the repos used on this device (`repos`, the open one chosen; another one opens
// the app there, `onSwitchRepo(full)`), Switch to another repository… (its owner/repo field, a step of its own) and Open
// on GitHub, as File manager's root menu (RepoMenu) has them; switching waits while a sync runs (`syncing`). `onBack`: its
// ← back to the sheet it was opened from (the phone's menu); none from the rail. Settings (a step, ←): the theme
// (`theme`, `onTheme`) and the emoji in names (`emojiNames`, { count, onMove }, null while icons can't be saved: how many
// files and folders start their name with an emoji; Move to icons, confirmed in a step of its own, takes it out of their
// names and makes it their icon, lib/icons.js), Notifications (whether this browser lets Folio notify, with Turn on) and
// Email reminders (`emailJob`: { ready: the job is in the repo, onSetUp() (null while it can't be written) }: Set up
// writes it, lib/emailJob.js; then the RESEND_API_KEY secret is added on GitHub).
const THEMES = [['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]]

export default function ProfileSheet({ login, email, repo, repos = [], syncing, onSwitchRepo, onSaveEmail, theme, onTheme, emojiNames, emailJob, onSignOut, start = 'main', onBack, onClose }) {
  const notify = useNotifyPermission()
  const inputRef = useRef()
  const [step, setStep] = useState(start)
  const [typed, setTyped] = useState(email)
  const [error, setError] = useState('')
  // ← in the title: from its email back to the profile, or, opened at its email from a date's reminder, back to the date's sheet (still open under it)
  const back = start === 'main' ? () => { setStep('main'); setError('') } : onClose

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
      onOpenAutoFocus={e => { e.preventDefault(); inputRef.current?.select() }}
    >
      <RepoForm
        initial={repo} onConnect={onSwitchRepo} inputRef={inputRef} inputClassName="font-mono"
        actions={({ busy, empty }) => (
          <div className="flex justify-end gap-space-sm">
            <Button type="button" variant="secondary" onClick={() => setStep('repo')}>Cancel</Button>
            <Button type="submit" disabled={busy || empty || syncing}>{busy ? 'Checking…' : syncing ? 'Syncing…' : 'Switch'}</Button>
          </div>
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
        {emailJob && <>
          <Separator />
          <div className="flex flex-col items-start gap-space-sm">
            <Label>Email reminders</Label>
            <p className="text-sm text-muted-foreground">
              {emailJob.ready
                ? <>A job in this repo sends the reminders set to email, every 15 minutes (often a few minutes late). It needs the <code className="code-chunk">{SECRET}</code> secret: a free key from resend.com, added on GitHub.</>
                : 'Reminders set to email need a small job in this repo that sends them every 15 minutes, through Resend (free). Setting it up adds it to the repo; Sync, then add your Resend key on GitHub. Your GitHub token needs Workflows: Read and write.'}
            </p>
            <div className="flex flex-wrap gap-space-sm">
              <Button variant="secondary" disabled={!emailJob.onSetUp} onClick={emailJob.onSetUp}>{emailJob.ready ? 'Update the job' : 'Set up'}</Button>
              {emailJob.ready && <Button variant="secondary" onClick={() => window.open(secretUrl(repo), '_blank', 'noopener,noreferrer')}><ArrowSquareOut /> Add the key</Button>}
              {emailJob.ready && <Button variant="secondary" onClick={() => window.open(runsUrl(repo), '_blank', 'noopener,noreferrer')}><ArrowSquareOut /> Its runs</Button>}
            </div>
          </div>
        </>}
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
      <div className="flex flex-wrap justify-end gap-space-sm">
        <Button variant="secondary" onClick={() => setStep('settings')}>Cancel</Button>
        <Button onClick={() => { emojiNames.onMove(); setStep('settings') }}>Move to icons</Button>
      </div>
    </BottomSheet>
  )

  if (step === 'email') {
    const save = e => {
      e.preventDefault()
      if (typed.trim() && !cleanEmail(typed)) return setError('Enter an email address, like me@example.com.')
      onSaveEmail(typed)
      back()
    }
    return (
      <BottomSheet title="Reminder email" description="Reminders set to email go here." onBack={back} onClose={onClose}>
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" placeholder="me@example.com" value={typed} onChange={e => { setTyped(e.target.value); setError('') }} />
            {error && <p className="text-destructive-ink text-xs">{error}</p>}
          </div>
          <div className="flex justify-end gap-space-sm">
            <Button type="button" variant="secondary" onClick={back}>Cancel</Button>
            <Button type="submit" disabled={!onSaveEmail || typed.trim() === email}>Save</Button>
          </div>
        </form>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet title="Profile" onBack={onBack} onClose={onClose} onOpenAutoFocus={e => e.preventDefault()}>
      <ul className="-mx-space-xs">
        <li><ListRow icon={<GithubLogo />} title={login} description="Signed in with GitHub" disabled /></li>
        <li><ListRow icon={<BookBookmark />} title={<span className="font-mono text-sm">{repo}</span>} description="Repository" onClick={() => setStep('repo')} trailing={<CaretRight className="mr-space-xs size-4 text-muted-foreground" />} /></li>
        <li>
          <ListRow
            icon={<EnvelopeSimple />} title={email || <Placeholder>No reminder email</Placeholder>} description="Reminder email"
            onClick={onSaveEmail ? () => setStep('email') : undefined} disabled={!onSaveEmail}
            trailing={<Button variant="ghost-quiet" size="icon-md" aria-label="Edit reminder email" tooltip="Edit" disabled={!onSaveEmail} onClick={() => setStep('email')}><PencilSimple /></Button>}
          />
        </li>
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
