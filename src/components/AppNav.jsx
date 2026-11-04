import { List, MagnifyingGlass } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import AccountMenu from './AccountMenu.jsx'
import { PAGE, MAIN_PAGES } from '../lib/pages.js'
import { useKeyboardInset } from '../hooks/useKeyboardInset.js'

// The app's primary navigation, in place of a header. `menu`: AccountMenu's
// props; `page` the open page; `syncButton` the SyncButton.
// Desktop (768px+): a labeled rail on the left: Home, File manager, Graph,
// then at the bottom Search, Sync and Menu (Broken links, Settings, Sign out).
export function NavRail({ page, onPage, onSearch, syncButton, menu }) {
  const inMenu = page === PAGE.SETTINGS || page === PAGE.LINKS
  return (
    <nav aria-label="Main" className="hidden md:flex w-56 shrink-0 flex-col gap-1 p-2">
      {MAIN_PAGES.map(({ id, title, icon: Icon }) => (
        <Button
          key={id} variant="ghost" aria-current={page === id ? 'page' : undefined}
          className={cn('justify-start gap-3 font-normal', page === id && 'bg-secondary')}
          onClick={() => onPage(id)}
        >
          <Icon /> {title}
        </Button>
      ))}
      <div className="flex-1" />
      <Button variant="ghost" className="justify-start gap-3 font-normal" onClick={onSearch}>
        <MagnifyingGlass /> Search
      </Button>
      {syncButton}
      <AccountMenu
        {...menu} current={page} onNavigate={onPage}
        trigger={
          <Button variant="ghost" className={cn('justify-start gap-3 font-normal', inMenu && 'bg-secondary')}>
            <List /> Menu
          </Button>
        }
      />
    </nav>
  )
}

// Phones: a floating panel at the bottom with ☰ (every page, then the rest),
// Search and Sync. Hidden while the keyboard is up.
export function FloatingNav({ page, onPage, onSearch, syncButton, menu }) {
  const keyboard = useKeyboardInset()
  if (keyboard > 0) return null
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-2 bottom-[calc(0.5rem+var(--safe-bottom))] z-40 flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 shadow-lg md:hidden"
    >
      <AccountMenu
        {...menu} pages current={page} onNavigate={onPage}
        trigger={
          <Button variant="ghost-outline" size="icon" aria-label="Menu" className="shrink-0 border-muted-foreground/50">
            <List />
          </Button>
        }
      />
      <Button variant="ghost-outline" size="icon" aria-label="Search" className="shrink-0 border-muted-foreground/50" onClick={onSearch}>
        <MagnifyingGlass />
      </Button>
      <div className="flex-1" />
      {syncButton}
    </nav>
  )
}
