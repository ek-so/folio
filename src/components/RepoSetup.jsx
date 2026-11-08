import { GithubLogo } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import RepoForm from './RepoForm.jsx'
import AuthLayout from './AuthLayout.jsx'

export default function RepoSetup({ user, onRepo, onLogout }) {
  return (
    <AuthLayout
      logo={<GithubLogo className="size-16 text-foreground" weight="fill" aria-hidden="true" />}
      title="Notes repo"
      intro="Which GitHub repo stores your notes?"
    >
        <RepoForm
          initial={`${user.login}/`}
          onConnect={onRepo}
          inputClassName="font-mono bg-card border-border"
          errorClassName="text-center"
          actions={({ busy, empty }) => (
            <Button type="submit" disabled={busy || empty} className="w-full">
              {busy ? 'Connecting…' : 'Connect'}
            </Button>
          )}
        />
        <Button variant="ghost" onClick={onLogout} className="text-muted-foreground">
          Sign out
        </Button>
    </AuthLayout>
  )
}
