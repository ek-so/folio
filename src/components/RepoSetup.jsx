import { GithubLogo } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import RepoForm from './RepoForm.jsx'

export default function RepoSetup({ user, onRepo, onLogout }) {
  return (
    <div className="flex min-h-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <GithubLogo className="size-16 text-foreground" weight="fill" aria-hidden="true" />
        <h1 className="text-2xl font-bold tracking-tight">Notes repo</h1>
        <p className="text-sm text-muted-foreground text-center">
          Which GitHub repo stores your notes?
        </p>
        <RepoForm
          initial={`${user.login}/`}
          onConnect={onRepo}
          inputClassName="font-mono bg-card border-border"
          actions={({ busy, empty }) => (
            <Button type="submit" disabled={busy || empty} className="w-full">
              {busy ? 'Connecting…' : 'Connect'}
            </Button>
          )}
        />
        <Button variant="ghost" onClick={onLogout} className="text-muted-foreground">
          Sign out
        </Button>
      </div>
    </div>
  )
}
