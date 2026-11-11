import { useEffect, useState } from 'react'
import { SignOut } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { SearchInput } from './ui/search-input.jsx'
import { Input } from './ui/input.jsx'
import { Radio } from './ui/checkbox.jsx'
import { ListRow, ListBox } from './ui/list-row.jsx'
import AuthLayout from './AuthLayout.jsx'
import AppLogo from './AppLogo.jsx'
import BrandName from './BrandName.jsx'
import SignInSteps from './SignInSteps.jsx'
import Spinner from './Spinner.jsx'
import { EmptyMessage } from './EmptyState.jsx'
import { listRepos, canWriteRepo, createRepo } from '../lib/github.js'
import { isRepoName } from '../lib/files.js'

const SEARCH_FROM = 11 // a search field shows above the list once it has this many repos

// The second sign-in step, under the app's logo and name like the first (the stepper's Token goes back to the
// first, the token kept): the repos
// the token can reach, as one-of-several choices (shown as they load; with more
// than 10, a search field above them); with none to show (nothing at all, or no match) a field to name a new repo, which is
// created private under the user's account and opened.
// Repos it can write to come first; the others are shown but can't be chosen
// ("No write access"). Shown even when there's only one; the first writable
// repo starts chosen. Continue checks that the token itself can write there
// (GitHub's list only knows the user's access), then opens it.
export default function RepoSetup({ repoList, onRepoList, onRepo, onBack, onLogout }) {
  const [repos, setRepos] = useState(repoList) // the list kept from the last visit with this token, if any
  const [done, setDone] = useState(!!repoList)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [denied, setDenied] = useState(() => new Set()) // the token can't write there after all
  const [chosen, setChosen] = useState(() => repoList?.find(r => r.canWrite)?.full ?? null) // a repo's full name, or none yet
  const [checking, setChecking] = useState(false)
  const [pickError, setPickError] = useState('')
  const [query, setQuery] = useState('')
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (repoList && attempt === 0) return
    let cancelled = false
    setError('')
    setRepos(null)
    setDone(false)
    ;(async () => {
      try {
        const all = []
        for await (const page of listRepos()) {
          if (cancelled) return
          all.push(...page)
          setRepos([...all])
          setChosen(c => c ?? page.find(r => r.canWrite)?.full ?? null)
        }
        if (!cancelled) { setRepos(all); onRepoList(all); setDone(true) }
      } catch {
        if (!cancelled) setError(navigator.onLine ? "Can't load your repos from GitHub." : "You're offline. Connect to the internet to load your repos.")
      }
    })()
    return () => { cancelled = true }
  }, [attempt])

  const writable = r => r.canWrite && !denied.has(r.full)
  const sorted = repos && [...repos.filter(writable), ...repos.filter(r => !writable(r))]
  const searching = !!repos && repos.length >= SEARCH_FROM
  const needle = searching ? query.trim().toLowerCase() : ''
  const found = sorted && (needle ? sorted.filter(r => r.full.toLowerCase().includes(needle)) : sorted)
  const choose = full => { setChosen(full); setPickError('') }

  async function submit() {
    if (!chosen) return
    if (!navigator.onLine) return setPickError("You're offline. Connect to the internet to check the repo.")
    setChecking(true)
    setPickError('')
    try {
      if (await canWriteRepo(...chosen.split('/'))) return onRepo(chosen)
      setPickError(`This token can't write to ${chosen}.`)
      setDenied(d => new Set(d).add(chosen))
      setChosen(null)
    } catch {
      setPickError("Can't check that repo with GitHub. Try again.")
    }
    setChecking(false)
  }

  async function create() {
    const name = newName.trim()
    if (!isRepoName(name)) return setPickError('Use letters, numbers, dots, dashes and underscores for the name.')
    if (!navigator.onLine) return setPickError("You're offline. Connect to the internet to create the repo.")
    setChecking(true)
    setPickError('')
    try {
      return onRepo(await createRepo(name))
    } catch (e) {
      setPickError(e.status === 422 ? `A repo named ${name} already exists.` : e.status === 403 || e.status === 404 ? "This token can't create repos." : "Can't create the repo with GitHub. Try again.")
    }
    setChecking(false)
  }

  return (
    <AuthLayout
      steps={<SignInSteps current={1} onBack={onBack} />}
      logo={<AppLogo className="size-20" />}
      title={<BrandName large />}
      intro="Choose the GitHub repo that stores your notes. Folio needs write access to it to save and modify your notes."
    >
      {/* Not a form: the rows are buttons, which in a form would submit it */}
      <div className="flex w-full flex-col items-center gap-space">
        {error ? (
          <>
            <p className="text-destructive-ink text-xs text-center">{error}</p>
            <Button variant="secondary" onClick={() => setAttempt(a => a + 1)}>Try again</Button>
          </>
        ) : !sorted ? (
          <div className="flex justify-center py-space"><Spinner /></div>
        ) : null}
        {searching && !error && (
          <SearchInput
            aria-label="Search repos"
            placeholder="Search repos…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="bg-card border-border"
          />
        )}
        {sorted && !error && (
          <div className="w-full rounded-lg border border-border bg-card p-space-xs">
            {/* With the search, as tall as it can be from the start, so searching never changes its height */}
            <ListBox role="radiogroup" aria-label="Repos" className={cn('mx-0', searching && 'h-64')}>
              {done && found.length === 0 && (
                <li>
                  <EmptyMessage size="sm">No repos found. Create your own:</EmptyMessage>
                  <Input
                    type="text"
                    aria-label="New repo name"
                    placeholder="new-repo-name"
                    value={newName}
                    onChange={e => { setNewName(e.target.value); setPickError('') }}
                    onKeyDown={e => e.key === 'Enter' && create()}
                    disabled={checking}
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    className="font-mono bg-background border-border"
                  />
                </li>
              )}
              {found.map(r => (
                <li key={r.full}>
                  <ListRow
                    icon={<Radio checked={chosen === r.full} />}
                    title={r.full}
                    onClick={() => choose(r.full)}
                    active={chosen === r.full}
                    disabled={!writable(r) || checking}
                    dimmed={!writable(r)}
                    trailing={!writable(r) && <span className="px-space-sm text-xs text-muted-foreground">No write access</span>}
                  />
                </li>
              ))}
              {!done && <li className="flex justify-center py-space-sm"><Spinner className="size-4" /></li>}
            </ListBox>
          </div>
        )}
        {pickError && <p className="text-destructive-ink text-xs text-center">{pickError}</p>}
        {sorted && !error && (found.length > 0 || !done ? (
          <Button disabled={checking || !chosen} className="w-full" onClick={submit}>
            {checking ? 'Checking…' : 'Continue'}
          </Button>
        ) : (
          <Button disabled={checking || !newName.trim()} className="w-full" onClick={create}>
            {checking ? 'Creating…' : 'Create repo'}
          </Button>
        ))}
      </div>
      <Button variant="ghost-destructive" onClick={onLogout}>
        <SignOut /> Sign out
      </Button>
    </AuthLayout>
  )
}
