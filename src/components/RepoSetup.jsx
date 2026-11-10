import { useEffect, useState } from 'react'
import { SignOut } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { ListRow, ListBox } from './ui/list-row.jsx'
import AuthLayout from './AuthLayout.jsx'
import FileIcon from './FileIcon.jsx'
import RepoForm from './RepoForm.jsx'
import Spinner from './Spinner.jsx'
import { listRepos, canWriteRepo } from '../lib/github.js'

// GitHub's official mark (public/github-mark.svg, from @primer/octicons). Phosphor's
// GithubLogo is only the cat; this one is the cat in its circle. A CSS mask paints it in
// the text color, so it follows the theme like an icon.
function GithubMark({ className }) {
  const url = `url(${import.meta.env.BASE_URL}github-mark.svg)`
  return <span aria-hidden="true" className={cn('shrink-0 bg-foreground', className)} style={{ mask: `${url} center / contain no-repeat`, WebkitMask: `${url} center / contain no-repeat` }} />
}

// The second sign-in step: the repos the token can reach, to pick the one that
// stores the notes, shown as they load. Repos it can write to come first; the
// others are shown but can't be picked ("No write access"). Shown even when
// there's only one. Picking one first checks that the token itself can write
// there (GitHub's list only knows the user's access). A repo the list leaves
// out can be typed by name.
export default function RepoSetup({ user, onRepo, onLogout }) {
  const [repos, setRepos] = useState(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [denied, setDenied] = useState(() => new Set()) // the token can't write there after all
  const [checking, setChecking] = useState(null)
  const [pickError, setPickError] = useState('')
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError('')
    setRepos(null)
    setDone(false)
    ;(async () => {
      try {
        for await (const page of listRepos()) {
          if (cancelled) return
          setRepos(r => [...(r ?? []), ...page])
        }
        if (!cancelled) { setRepos(r => r ?? []); setDone(true) }
      } catch {
        if (!cancelled) setError(navigator.onLine ? "Can't load your repos from GitHub." : "You're offline. Connect to the internet to load your repos.")
      }
    })()
    return () => { cancelled = true }
  }, [attempt])

  const writable = r => r.canWrite && !denied.has(r.full)
  const sorted = repos && [...repos.filter(writable), ...repos.filter(r => !writable(r))]

  async function pick(full) {
    setChecking(full)
    setPickError('')
    try {
      if (await canWriteRepo(...full.split('/'))) return onRepo(full)
      setDenied(d => new Set(d).add(full))
    } catch {
      setPickError("Can't check that repo with GitHub. Try again.")
    }
    setChecking(null)
  }

  return (
    <AuthLayout
      logo={<GithubMark className="size-16" />}
      title="Notes repo"
      intro="Choose the GitHub repo that stores your notes."
    >
      {error ? (
        <>
          <p className="text-destructive-ink text-xs text-center">{error}</p>
          <Button variant="secondary" onClick={() => setAttempt(a => a + 1)}>Try again</Button>
        </>
      ) : !sorted ? (
        <div className="flex justify-center py-space"><Spinner /></div>
      ) : sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center">This token can't reach any repo. Create a new token with access to your notes repo.</p>
      ) : (
        <div className="w-full rounded-lg border border-border bg-card p-space-xs">
          <ListBox className="mx-0">
            {sorted.map(r => (
              <li key={r.full}>
                <ListRow
                  icon={<FileIcon path="" dir />}
                  title={r.full}
                  onClick={() => pick(r.full)}
                  disabled={!writable(r) || !!checking}
                  dimmed={!writable(r)}
                  trailing={
                    checking === r.full ? <Spinner className="mx-space-sm size-4" />
                    : !writable(r) && <span className="px-space-sm text-xs text-muted-foreground">No write access</span>
                  }
                />
              </li>
            ))}
          </ListBox>
        </div>
      )}
      {sorted && !done && !error && <Spinner className="size-4" />}
      {pickError && <p className="text-destructive-ink text-xs text-center">{pickError}</p>}
      {typing ? (
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
      ) : (
        <Button variant="link" onClick={() => setTyping(true)}>Enter a repo by name</Button>
      )}
      <Button variant="ghost-destructive" onClick={onLogout}>
        <SignOut /> Sign out
      </Button>
    </AuthLayout>
  )
}
