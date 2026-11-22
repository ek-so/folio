import { useState } from 'react'
import { SidebarSimple, MagnifyingGlass, Images, LinkBreak, BookOpen, UserCircle, ClockCounterClockwise, Bell } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { Separator } from './ui/separator.jsx'
import { Kbd, KbdGroup } from './ui/kbd.jsx'
import { searchKeys, IS_MAC } from '../lib/shortcuts.js'
import { SELECTED } from './ui/list-row.jsx'
import AccountMenu from './AccountMenu.jsx'
import { PAGE } from '../lib/pages.js'
import { storage } from '../lib/storage.js'
import { RAIL_WIDTH } from '../lib/resize.js'
import { useResizableWidth } from '../hooks/useResizableWidth.js'
import ResizeHandle from './ResizeHandle.jsx'
import { useHideOnScroll } from '../hooks/useHideOnScroll.js'
import AppLogo from './AppLogo.jsx'
import BrandName from './BrandName.jsx'
import ViewMenu, { ViewsTitle } from './ViewMenu.jsx'
import PageTitle from './PageTitle.jsx'
import PageIcon from './PageIcon.jsx'
import { Dot } from '@/components/ui/dot.jsx'


// The app's primary navigation, in place of a header. `menu`: brokenCount, unseenReminders (Notifications' count: reminders come due since it was last opened) and
// onProfile (the Profile sheet: the repository, settings and Sign out); `page` the open page; `renderSync(compact, bar)` makes the SyncButton (`bar`: the phone's top bar).
// Desktop (768px+): a left rail, 16px from the top, left and bottom like the content boxes' 16px around; where
// they meet, 8px each: the rail's right and the content box's left. On top a header row, level with the title
// bars' rows (8px and a 1px top edge like the boxes' outline above it): the app's name (Folio, bold) and a
// button that collapses the rail to icons only (remembered on this device; expanded, its edge is a drag handle);
// then a separator like every other; Search and Sync, a separator, the views under their title (`ViewsTitle`: "Views" and its ⋯), a separator, File manager, Assets and Graph (plain items, no separator between them),
// and at the bottom Notifications (count), Recent updates, Broken links (count), Documentation and Profile.
// `pages`: the main pages (lib/pages.js): the views, File manager and Graph. With a
// mouse, a view shows its ⋯ (`ViewMenu`, `viewActions`) on hover; the collapsed rail has none of them, and the title only its ⋯.
// A plain click (not one that opens a new tab or window): the app handles it in place
const plainClick = e => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

// `hrefOf(id)`: the address of where a main page was left (its open note or folder), the link its item is: hovering
// shows it, and it opens or copies like any link; a plain click opens the page in place (`onPage`)
const SEARCH_KEYS = searchKeys(IS_MAC)

export function NavRail({ page, pages, hrefOf, viewActions, onPage, onSearch, renderSync, menu }) {
  const [collapsed, setCollapsed] = useState(storage.getRailCollapsed)
  const [width, resize] = useResizableWidth(RAIL_WIDTH, storage.getRailWidth, storage.setRailWidth)
  const toggle = () => { setCollapsed(!collapsed); storage.setRailCollapsed(!collapsed) }
  const item = id => cn('justify-start gap-3 font-normal', collapsed && 'size-control justify-center px-0', page === id && SELECTED)
  // A rail button: icon, and its label unless collapsed (then the label is the tooltip)
  const label = text => collapsed ? <span className="sr-only">{text}</span> : text
  const hint = text => collapsed ? text : undefined
  const pageButton = p => (
    <Button asChild variant="ghost" tooltip={hint(p.title)} tooltipSide="right" aria-current={page === p.id ? 'page' : undefined} className={cn(item(p.id), !collapsed && 'w-full', !collapsed && p.view && 'pr-10')}>
      <a href={hrefOf(p.id)} onClick={e => { if (plainClick(e)) { e.preventDefault(); onPage(p.id) } }}>
        <PageIcon page={p} /> {collapsed ? label(p.title) : <span className="min-w-0 truncate"><PageTitle page={p} /></span>}
      </a>
    </Button>
  )
  // Items in a group touch (no gap); a separator has 16px (--space) on both sides
  const separator = <Separator decorative={false} className="my-space" />
  const collapseButton = (
    <Button variant="ghost" size="icon" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} tooltip={collapsed ? 'Expand menu' : 'Collapse menu'} tooltipSide={collapsed ? 'right' : undefined} aria-expanded={!collapsed} className="group shrink-0 focus-visible:bg-secondary" onClick={toggle}>
      {/* Collapsed, the logo stands in for the button until it's hovered or focused */}
      {collapsed && <AppLogo className="size-6 group-hover:hidden group-focus-visible:hidden" />}
      <SidebarSimple className={cn(collapsed && 'hidden group-hover:block group-focus-visible:block')} />
    </Button>
  )
  return (
    <nav aria-label="Main" style={collapsed ? undefined : { width }} className={cn('relative hidden md:flex shrink-0 flex-col p-space pr-space-sm', collapsed ? 'items-center' : 'max-w-[25vw]')}>
      {collapsed ? <>
        {/* Collapsed: the logo button (level with the title bars' rows), then one separator (expanded: the header row, then it) */}
        <div className="flex shrink-0 justify-center self-stretch border-t border-t-transparent pt-space">{collapseButton}</div>
        {separator}
      </> : <>
        <div className="flex shrink-0 items-center gap-space-sm self-stretch border-t border-t-transparent pt-space pl-3">
          <span className="flex flex-1 items-center gap-space-sm"><AppLogo className="size-6" /><BrandName /></span>
          {collapseButton}
        </div>
        {separator}
      </>}
      {/* Search and Sync on top, plain items like the others. Search shows its
          shortcut (⌘K / Ctrl+K, lib/shortcuts.js) on its right, or in its tooltip when collapsed */}
      <Button variant="ghost" tooltip={hint(`Search ${SEARCH_KEYS.join(IS_MAC ? '' : '+')}`)} tooltipSide="right" aria-keyshortcuts={IS_MAC ? 'Meta+K' : 'Control+K'} className={cn('justify-start gap-3 font-normal', collapsed && 'size-control justify-center px-0')} onClick={onSearch}>
        <MagnifyingGlass /> {label('Search')}
        {!collapsed && <KbdGroup aria-hidden className="ml-auto">{SEARCH_KEYS.map(k => <Kbd key={k}>{k}</Kbd>)}</KbdGroup>}
      </Button>
      {renderSync(collapsed)}
      {separator}
      <ViewsTitle actions={viewActions} collapsed={collapsed} />
      {pages.filter(p => p.view).map(p => (
        <div key={p.id} className="group relative">
          {pageButton(p)}
          {!collapsed && (
            <div className="absolute inset-y-0 right-1 flex items-center">
              <ViewMenu view={p} actions={viewActions} inRow />
            </div>
          )}
        </div>
      ))}
      {separator}
      {pages.filter(p => p.id === PAGE.FILES).map(p => <div key={p.id}>{pageButton(p)}</div>)}
      <Button variant="ghost" tooltip={hint('Assets')} tooltipSide="right" aria-current={page === PAGE.ASSETS ? 'page' : undefined} className={item(PAGE.ASSETS)} onClick={() => onPage(PAGE.ASSETS)}>
        <Images /> {label('Assets')}
      </Button>
      {pages.filter(p => p.id === PAGE.GRAPH).map(p => <div key={p.id}>{pageButton(p)}</div>)}
      <div className="flex-1" />
      {separator}
      <Button variant="ghost" tooltip={hint('Notifications')} tooltipSide="right" aria-current={page === PAGE.NOTIFICATIONS ? 'page' : undefined} className={cn(item(PAGE.NOTIFICATIONS), 'relative')} onClick={() => onPage(PAGE.NOTIFICATIONS)}>
        <Bell /> {label('Notifications')}
        {menu.unseenReminders > 0 && (collapsed
          ? <Dot tone="destructive" size="md" corner aria-label={`${menu.unseenReminders} new`} />
          : <span className="ml-auto text-destructive-ink">{menu.unseenReminders}</span>)}
      </Button>
      <Button variant="ghost" tooltip={hint('Recent updates')} tooltipSide="right" aria-current={page === PAGE.HISTORY ? 'page' : undefined} className={item(PAGE.HISTORY)} onClick={() => onPage(PAGE.HISTORY)}>
        <ClockCounterClockwise /> {label('Recent updates')}
      </Button>
      <Button variant="ghost" tooltip={hint('Broken links')} tooltipSide="right" aria-current={page === PAGE.LINKS ? 'page' : undefined} className={cn(item(PAGE.LINKS), 'relative')} onClick={() => onPage(PAGE.LINKS)}>
        <LinkBreak /> {label('Broken links')}
        {menu.brokenCount > 0 && (collapsed
          ? <Dot tone="muted" size="md" corner aria-label={`${menu.brokenCount} broken`} />
          : <span className="ml-auto text-muted-foreground">{menu.brokenCount}</span>)}
      </Button>
      <Button variant="ghost" tooltip={hint('Documentation')} tooltipSide="right" aria-current={page === PAGE.DOCS ? 'page' : undefined} className={item(PAGE.DOCS)} onClick={() => onPage(PAGE.DOCS)}>
        <BookOpen /> {label('Documentation')}
      </Button>
      <Button variant="ghost" tooltip={hint('Profile')} tooltipSide="right" className={cn('justify-start gap-3 font-normal', collapsed && 'size-control justify-center px-0')} onClick={() => menu.onProfile()}>
        <UserCircle /> {label('Profile')}
      </Button>
      {!collapsed && <ResizeHandle label="Resize menu" size={width} limits={RAIL_WIDTH} onResize={resize} className="inset-y-space" />}
    </nav>
  )
}

// Phones: a bar at the top with the menu (the app's logo and name, an outlined button: every page, then the rest) on the
// left, Notifications (its bell, with a red dot on its corner while some came due since it was last opened: `menu.unseenReminders`, like Sync's),
// Sync and Search (last) on the right. It slides away while
// the content scrolls down and returns on scrolling up (`useHideOnScroll`): its row folds in 300ms with a gentle ease while
// what's in it slides up and fades, so the page under it moves softly.
export function TopBar({ host, resetKey, page, pages, viewActions, onPage, onSearch, renderSync, menu }) {
  const hidden = useHideOnScroll(host, resetKey)
  return (
    <div className={cn('grid shrink-0 transition-[grid-template-rows,visibility] duration-300 ease-[cubic-bezier(0.2,0,0,1)] md:hidden', hidden ? 'grid-rows-[0fr] invisible' : 'grid-rows-[1fr]')}>
    <nav aria-label="Main" className="min-h-0 overflow-hidden">
    {/* The bar's row folds while its content slides up and fades with it, rather than being cut off */}
    <div className={cn('transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)]', hidden && '-translate-y-full opacity-0')}>
    <div className="flex items-center gap-space-sm px-space py-space">
      <AccountMenu {...menu} current={page} pages={pages} viewActions={viewActions} onNavigate={onPage} />
      <div className="flex-1" />
      <Button
        variant="ghost-outline" size="icon" className={cn('relative', page === PAGE.NOTIFICATIONS && SELECTED)}
        aria-label={menu.unseenReminders ? `Notifications, ${menu.unseenReminders} new` : 'Notifications'}
        aria-current={page === PAGE.NOTIFICATIONS ? 'page' : undefined} onClick={() => onPage(PAGE.NOTIFICATIONS)}
      >
        <Bell />
        {menu.unseenReminders > 0 && <Dot tone="destructive" size="md" corner />}
      </Button>
      {renderSync(false, true)}
      <Button variant="ghost-outline" size="icon" aria-label="Search" onClick={onSearch}>
        <MagnifyingGlass />
      </Button>
    </div>
    </div>
    </nav>
    </div>
  )
}
