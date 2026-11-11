import { useEffect, useState } from 'react'
import { SignOut } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { Radio } from './ui/checkbox.jsx'
import { ListRow, ListBox } from './ui/list-row.jsx'
import AuthLayout from './AuthLayout.jsx'
import AppLogo from './AppLogo.jsx'
import BrandName from './BrandName.jsx'
import Spinner from './Spinner.jsx'
import { listRepos, checkRepo, canWriteRepo } from '../lib/github.js'
import { parseRepo } from '../lib/files.js'

const TYPED = '' // the choice of the last row, where a repo is typed by name
const SEARCH_FROM = 11 // a search field shows above the list once it has this many repos

// The second sign-in step, under the app's logo and name like the first: the repos
// the token can reach, as one-of-several choices (shown as they load; with more
// than 10, a search field above them), and a last row to type one the list leaves out.
// Repos it can write to come first; the others are shown but can't be chosen
// ("No write access"). Shown even when there's only one; the first writable
// repo starts chosen. Continue checks that the token itself can write there
// (GitHub's list only knows the user's access), then opens it.
export default function RepoSetup({ user, onRepo, onLogout }) {
  const [repos, setRepos] = useState(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [denied, setDenied] = useState(() => new Set()) // the token can't write there after all
  const [chosen, setChosen] = useState(null) // a repo's full name, TYPED, or none yet
  const [typed, setTyped] = useState(`${user.login}/`)
  const [checking, setChecking] = useState(false)
  const [pickError, setPickError] = useState('')
  const [query, setQuery] = useState('')

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
          setChosen(c => c ?? page.find(r => r.canWrite)?.full ?? null)
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
  const searching = !!repos && repos.length >= SEARCH_FROM
  const needle = searching ? query.trim().toLowerCase() : ''
  const found = sorted && (needle ? sorted.filter(r => r.full.toLowerCase().includes(needle)) : sorted)
  const choose = full => { setChosen(full); setPickError('') }
  const target = chosen === TYPED ? parseRepo(typed)?.join('/') : chosen

  async function submit() {
    if (!target) return setPickError(chosen === TYPED ? 'Use owner/repo format, e.g. ek-so/brain' : '')
    if (!navigator.onLine) return setPickError("You're offline. Connect to the internet to check the repo.")
    setChecking(true)
    setPickError('')
    try {
      if (chosen === TYPED) await checkRepo(...target.split('/')).catch(() => { throw new Error('missing') })
      if (await canWriteRepo(...target.split('/'))) return onRepo(target)
      setPickError(`This token can't write to ${target}.`)
      if (chosen !== TYPED) { setDenied(d => new Set(d).add(target)); setChosen(null) }
    } catch (e) {
      setPickError(e.message === 'missing' ? "Can't access that repo. Check the name and token permissions." : "Can't check that repo with GitHub. Try again.")
    }
    setChecking(false)
  }

  return (
    <AuthLayout
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
        ) : sorted.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">This token can't reach any repo in its list. Type yours below, or create a new token with access to it.</p>
        )}
        {searching && !error && (
          <Input
            type="text"
            aria-label="Search repos"
            placeholder="Search repos…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            className="bg-card border-border"
          />
        )}
        {sorted && !error && (
          <div className="w-full rounded-lg border border-border bg-card p-space-xs">
            <ListBox role="radiogroup" aria-label="Repos" className="mx-0">
              {needle && found.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No repos match “{query.trim()}”</li>}
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
              {/* The last choice: a repo typed by name, an outlined field from the start (its box where the names above start); focusing it chooses it */}
              <li className={cn('flex min-h-control items-center gap-3 rounded-sm py-space-xs pl-3 pr-space-xs', chosen === TYPED && 'bg-primary/15')}>
                <button type="button" aria-label="Type a repo" className="flex min-h-control items-center" disabled={checking} onClick={() => choose(TYPED)}>
                  <Radio checked={chosen === TYPED} />
                </button>
                <Input
                  type="text"
                  aria-label="Repo by name, owner/repo"
                  placeholder="owner/repo"
                  value={typed}
                  onFocus={() => choose(TYPED)}
                  onChange={e => { setTyped(e.target.value); choose(TYPED) }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  disabled={checking}
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  className="font-mono bg-background border-border"
                />
              </li>
            </ListBox>
          </div>
        )}
        {pickError && <p className="text-destructive-ink text-xs text-center">{pickError}</p>}
        {sorted && !error && (
          <Button disabled={checking || !target} className="w-full" onClick={submit}>
            {checking ? 'Checking…' : 'Continue'}
          </Button>
        )}
      </div>
      <Button variant="ghost-destructive" onClick={onLogout}>
        <SignOut /> Sign out
      </Button>
    </AuthLayout>
  )
}
