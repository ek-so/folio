import { useState } from 'react'
import { List, SidebarSimple, MagnifyingGlass, LinkBreak, Gear, SignOut } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import AccountMenu from './AccountMenu.jsx'
import { PAGE, MAIN_PAGES } from '../lib/pages.js'
import { storage } from '../lib/storage.js'
import { RAIL_WIDTH } from '../lib/resize.js'
import { useResizableWidth } from '../hooks/useResizableWidth.js'
import ResizeHandle from './ResizeHandle.jsx'
import { useKeyboardInset } from '../hooks/useKeyboardInset.js'
import AppLogo from './AppLogo.jsx'

// The open page's button: light accent fill, accent text
const ACTIVE = 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary'

// The app's primary navigation, in place of a header. `menu`: brokenCount and
// onSignOut; `page` the open page; `renderSync(compact)` makes the SyncButton.
// Desktop (768px+): a left rail (the content's own 16px gutter is the gap to
// the tree). On top the app's name (Folio, bold) and a button that collapses
// the rail to icons only (remembered on this device; expanded, its edge is a drag handle); then Search and Sync,
// Home, File manager, Graph, and at the bottom Broken links (count),
// Settings and Sign out.
export function NavRail({ page, onPage, onSearch, renderSync, menu }) {
  const [collapsed, setCollapsed] = useState(storage.getRailCollapsed)
  const [width, resize] = useResizableWidth(RAIL_WIDTH, storage.getRailWidth, storage.setRailWidth)
  const toggle = () => { setCollapsed(!collapsed); storage.setRailCollapsed(!collapsed) }
  const item = id => cn('justify-start gap-3 font-normal', collapsed && 'size-control justify-center px-0', page === id && ACTIVE)
  // A rail button: icon, and its label unless collapsed (then the label is the tooltip)
  const label = text => collapsed ? <span className="sr-only">{text}</span> : text
  const hint = text => collapsed ? text : undefined
  return (
    <nav aria-label="Main" style={collapsed ? undefined : { width }} className={cn('relative hidden md:flex shrink-0 flex-col gap-1 py-space pl-space', collapsed ? 'w-14 items-center' : 'max-w-[25vw]')}>
      <div className={cn('flex h-control items-center justify-between pl-3', collapsed && 'justify-center pl-0')}>
        {!collapsed && <span className="flex items-center gap-2 text-base font-bold"><AppLogo className="size-6" />Folio</span>}
        <Button variant="ghost-outline" size="icon" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} title={collapsed ? 'Expand menu' : 'Collapse menu'} aria-expanded={!collapsed} className={cn('group shrink-0 border-muted-foreground/50', collapsed && 'bg-transparent hover:bg-secondary focus-visible:bg-secondary')} onClick={toggle}>
          {/* Collapsed, the logo stands in for the button until it's hovered or focused */}
          {collapsed && <AppLogo className="size-6 group-hover:hidden group-focus-visible:hidden" />}
          <SidebarSimple className={cn(collapsed && 'hidden group-hover:block group-focus-visible:block')} />
        </Button>
      </div>
      <div className="h-2" />
      <div className={cn('flex flex-col gap-space', collapsed && 'items-center')}>
        <Button variant="outline" title={hint('Search')} className={cn('justify-start gap-3 px-3 font-normal text-muted-foreground shadow-sm hover:bg-transparent hover:text-foreground', collapsed && 'size-control justify-center px-0')} onClick={onSearch}>
          <MagnifyingGlass /> {label('Search')}
        </Button>
        {renderSync(collapsed)}
      </div>
      <div className="h-2" />
      {MAIN_PAGES.map(({ id, title, icon: Icon }) => (
        <Button key={id} variant="ghost" title={hint(title)} aria-current={page === id ? 'page' : undefined} className={item(id)} onClick={() => onPage(id)}>
          <Icon /> {label(title)}
        </Button>
      ))}
      <div className="flex-1" />
      {/* my-3 + the 4px gap = 16px (--space) on both sides */}
      <div role="separator" className="my-3 h-px w-full shrink-0 bg-border" />
      <Button variant="ghost" title={hint('Broken links')} aria-current={page === PAGE.LINKS ? 'page' : undefined} className={cn(item(PAGE.LINKS), 'relative')} onClick={() => onPage(PAGE.LINKS)}>
        <LinkBreak /> {label('Broken links')}
        {menu.brokenCount > 0 && (collapsed
          ? <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-muted-foreground" aria-label={`${menu.brokenCount} broken`} />
          : <span className="ml-auto text-muted-foreground">{menu.brokenCount}</span>)}
      </Button>
      <Button variant="ghost" title={hint('Settings')} aria-current={page === PAGE.SETTINGS ? 'page' : undefined} className={item(PAGE.SETTINGS)} onClick={() => onPage(PAGE.SETTINGS)}>
        <Gear /> {label('Settings')}
      </Button>
      <Button variant="ghost" title={hint('Sign out')} className={cn('justify-start gap-3 font-normal text-destructive', collapsed && 'size-control justify-center px-0')} onClick={menu.onSignOut}>
        <SignOut /> {label('Sign out')}
      </Button>
      {!collapsed && <ResizeHandle label="Resize menu" width={width} limits={RAIL_WIDTH} onResize={resize} className="inset-y-space" />}
    </nav>
  )
}

// Phones: a floating panel at the bottom with ☰ (every page, then the rest),
// Search and Sync. Hidden while the keyboard is up.
export function FloatingNav({ page, onPage, onSearch, renderSync, menu }) {
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
      {renderSync(false)}
    </nav>
  )
}
