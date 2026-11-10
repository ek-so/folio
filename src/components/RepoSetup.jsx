import { useEffect, useState } from 'react'
import { GithubLogo, SignOut } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { ListRow, ListBox } from './ui/list-row.jsx'
import AuthLayout from './AuthLayout.jsx'
import FileIcon from './FileIcon.jsx'
import Spinner from './Spinner.jsx'
import { listRepos } from '../lib/github.js'

// The second sign-in step: the repos the token can reach, to pick the one that
// stores the notes. Repos it can write to come first; the others are shown
// but can't be picked ("No write access"). Shown even when there's only one.
export default function RepoSetup({ onRepo, onLogout }) {
  const [repos, setRepos] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    setError('')
    setRepos(null)
    listRepos()
      .then(list => setRepos([...list.filter(r => r.canWrite), ...list.filter(r => !r.canWrite)]))
      .catch(() => setError(navigator.onLine ? "Can't load your repos from GitHub." : "You're offline. Connect to the internet to load your repos."))
  }, [attempt])

  return (
    <AuthLayout
      logo={<GithubLogo className="size-16 text-foreground" aria-hidden="true" />}
      title="Notes repo"
      intro="Choose the GitHub repo that stores your notes."
    >
      {error ? (
        <>
          <p className="text-destructive-ink text-xs text-center">{error}</p>
          <Button variant="secondary" onClick={() => setAttempt(a => a + 1)}>Try again</Button>
        </>
      ) : !repos ? (
        <div className="flex justify-center py-space"><Spinner /></div>
      ) : repos.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center">This token can't reach any repo. Create a new token with access to your notes repo.</p>
      ) : (
        <div className="w-full rounded-lg border border-border bg-card p-space-xs">
        <ListBox className="mx-0">
          {repos.map(r => (
            <li key={r.full}>
              <ListRow
                icon={<FileIcon path="" dir />}
                title={r.full}
                onClick={() => onRepo(r.full)}
                disabled={!r.canWrite}
                dimmed={!r.canWrite}
                trailing={!r.canWrite && <span className="px-space-sm text-xs text-muted-foreground">No write access</span>}
              />
            </li>
          ))}
        </ListBox>
        </div>
      )}
      <Button variant="ghost-destructive" onClick={onLogout}>
        <SignOut /> Sign out
      </Button>
    </AuthLayout>
  )
}
