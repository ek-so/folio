import { useContext, useRef, useState } from 'react'
import { ArrowSquareOut, CaretDown, Check, GitBranch } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu.jsx'
import BottomSheet from './BottomSheet.jsx'
import RepoForm from './RepoForm.jsx'
import { NavContext } from './NavTree.jsx'

// The repo's name atop the file tree, as a menu: the repos used on this
// device (the open one checked; another one opens the app there), Switch
// repository… (a sheet with the owner/repo field) and Open on GitHub.
// Switching waits while a sync runs, so it's never cut off.
export default function RepoMenu() {
  const nav = useContext(NavContext)
  const [switching, setSwitching] = useState(false)
  const inputRef = useRef()
  const name = nav.repo.split('/')[1]
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="min-w-0 max-w-full text-base font-bold">
            <span className="truncate">{name}</span>
            <CaretDown className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-w-[min(20rem,calc(100vw-2*var(--space)))]" onCloseAutoFocus={e => e.preventDefault()}>
          {nav.repos.map(repo => (
            <DropdownMenuItem key={repo} disabled={nav.syncing && repo !== nav.repo} onSelect={() => repo !== nav.repo && nav.onSwitchRepo(repo)}>
              {repo === nav.repo ? <Check /> : <span className="size-4" />}
              <span className="truncate">{repo}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={nav.syncing} onSelect={() => setSwitching(true)}><GitBranch /> Switch repository…</DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`https://github.com/${nav.repo}`} target="_blank" rel="noreferrer"><ArrowSquareOut /> Open on GitHub</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {switching && (
        <BottomSheet
          title="Switch repository"
          description="Unsynced changes stay on this device with their repo."
          onClose={() => setSwitching(false)}
          onOpenAutoFocus={e => { e.preventDefault(); inputRef.current?.select() }}
        >
          <RepoForm
            initial={nav.repo}
            onConnect={nav.onSwitchRepo}
            inputRef={inputRef}
            inputClassName="font-mono bg-background border-border"
            actions={({ busy, empty }) => (
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setSwitching(false)}>Cancel</Button>
                <Button type="submit" disabled={busy || empty || nav.syncing}>{busy ? 'Checking…' : nav.syncing ? 'Syncing…' : 'Switch'}</Button>
              </div>
            )}
          />
        </BottomSheet>
      )}
    </>
  )
}
