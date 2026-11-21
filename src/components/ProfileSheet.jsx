import { useState } from 'react'
import { EnvelopeSimple, PencilSimple, SignOut, GithubLogo } from '@phosphor-icons/react'
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
// confirms it). `start`: 'email' opens it at the email's field (Change in a date's reminder), with no ← to step back to.
// `onSaveEmail(text)` (null while the profile can't be saved): '' takes the address out.
export default function ProfileSheet({ login, email, onSaveEmail, onSignOut, start = 'main', onClose }) {
  const [step, setStep] = useState(start)
  const [typed, setTyped] = useState(email)
  const [error, setError] = useState('')
  const back = start === 'main' ? () => { setStep('main'); setError('') } : undefined

  if (step === 'email') {
    const save = e => {
      e.preventDefault()
      if (typed.trim() && !cleanEmail(typed)) return setError('Enter an email address, like me@example.com.')
      onSaveEmail(typed)
      if (back) back()
      else onClose()
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
            <Button type="button" variant="secondary" onClick={back ?? onClose}>Cancel</Button>
            <Button type="submit" disabled={!onSaveEmail || typed.trim() === email}>Save</Button>
          </div>
        </form>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet title="Profile" onClose={onClose} onOpenAutoFocus={e => e.preventDefault()}>
      <ul className="-mx-space-xs">
        <li><ListRow icon={<GithubLogo />} title={login} description="Signed in with GitHub" disabled /></li>
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
        <li><ListRow icon={<SignOut className="text-destructive-ink" />} title={<span className="text-destructive-ink">Sign out</span>} onClick={onSignOut} /></li>
      </ul>
    </BottomSheet>
  )
}
