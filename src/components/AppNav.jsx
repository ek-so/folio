import { List, MagnifyingGlass, LinkBreak, Gear, SignOut } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import AccountMenu from './AccountMenu.jsx'
import { PAGE, MAIN_PAGES } from '../lib/pages.js'
import { useKeyboardInset } from '../hooks/useKeyboardInset.js'

// The open page's button: light accent fill, accent text
const ACTIVE = 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary'

// The app's primary navigation, in place of a header. `menu`: brokenCount and
// onSignOut; `page` the open page; `syncButton` the SyncButton.
// Desktop (768px+): a labeled rail on the left (the content's own 16px gutter
// is the gap to the tree): Search and Sync on top, then
// Home, File manager, Graph, and at the bottom Broken links (count),
// Settings and Sign out.
export function NavRail({ page, onPage, onSearch, syncButton, menu }) {
  const item = id => cn('justify-start gap-3 font-normal', page === id && ACTIVE)
  return (
    <nav aria-label="Main" className="hidden md:flex w-56 shrink-0 flex-col gap-1 py-space pl-space">
      <div className="flex flex-col gap-space">
        <Button variant="outline" className="justify-start gap-3 px-3 font-normal text-muted-foreground shadow-sm hover:bg-transparent hover:text-foreground" onClick={onSearch}>
          <MagnifyingGlass /> Search
        </Button>
        {syncButton}
      </div>
      <div className="h-2" />
      {MAIN_PAGES.map(({ id, title, icon: Icon }) => (
        <Button key={id} variant="ghost" aria-current={page === id ? 'page' : undefined} className={item(id)} onClick={() => onPage(id)}>
          <Icon /> {title}
        </Button>
      ))}
      <div className="flex-1" />
      <div role="separator" className="my-1 h-px shrink-0 bg-border" />
      <Button variant="ghost" aria-current={page === PAGE.LINKS ? 'page' : undefined} className={item(PAGE.LINKS)} onClick={() => onPage(PAGE.LINKS)}>
        <LinkBreak /> Broken links
        {menu.brokenCount > 0 && <span className="ml-auto text-muted-foreground">{menu.brokenCount}</span>}
      </Button>
      <Button variant="ghost" aria-current={page === PAGE.SETTINGS ? 'page' : undefined} className={item(PAGE.SETTINGS)} onClick={() => onPage(PAGE.SETTINGS)}>
        <Gear /> Settings
      </Button>
      <Button variant="ghost" className="justify-start gap-3 font-normal text-destructive" onClick={menu.onSignOut}>
        <SignOut /> Sign out
      </Button>
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
      className="fixed inset-x-space bottom-[calc(var(--space)+var(--safe-bottom))] z-40 flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 shadow-lg md:hidden"
    >
      <AccountMenu
        {...menu} current={page} onNavigate={onPage}
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
