import { useState } from 'react'
import { List, SidebarSimple, MagnifyingGlass, Images, LinkBreak, BookOpen, Gear, SignOut, SlidersHorizontal } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { Separator } from './ui/separator.jsx'
import { SELECTED } from './ui/list-row.jsx'
import AccountMenu from './AccountMenu.jsx'
import { PAGE } from '../lib/pages.js'
import { storage } from '../lib/storage.js'
import { RAIL_WIDTH } from '../lib/resize.js'
import { useResizableWidth } from '../hooks/useResizableWidth.js'
import ResizeHandle from './ResizeHandle.jsx'
import { useHideOnScroll } from '../hooks/useHideOnScroll.js'
import AppLogo from './AppLogo.jsx'
import ViewMenu from './ViewMenu.jsx'
import PageTitle from './PageTitle.jsx'
import PageIcon from './PageIcon.jsx'


// The app's primary navigation, in place of a header. `menu`: brokenCount and
// onSignOut; `page` the open page; `renderSync(compact, bar)` makes the SyncButton (`bar`: the phone's top bar).
// Desktop (768px+): a left rail, 16px from the top, left and bottom like the content boxes' 16px around; where
// they meet, 8px each: the rail's right and the content box's left. On top a header row, level with the title
// bars' rows (8px and a 1px top edge like the boxes' outline above it): the app's name (Folio, bold) and a
// button that collapses the rail to icons only (remembered on this device; expanded, its edge is a drag handle);
// then a separator like every other; Search, Sync, File manager, Assets and Graph (plain items, no separator between them), a separator, the views, Views settings,
// and at the bottom Broken links (count), Settings and Sign out.
// `pages`: the main pages (lib/pages.js): the views, File manager and Graph. With a
// mouse, a view shows its ⋯ (Rename / Remove: `viewActions`) on hover; the collapsed rail has none, and Views settings is an icon.
// A plain click (not one that opens a new tab or window): the app handles it in place
const plainClick = e => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

// `hrefOf(id)`: the address of where a main page was left (its open note or folder), the link its item is: hovering
// shows it, and it opens or copies like any link; a plain click opens the page in place (`onPage`)
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
        <div className="flex shrink-0 justify-center self-stretch border-t border-t-transparent pt-space-sm">{collapseButton}</div>
        {separator}
      </> : <>
        <div className="flex shrink-0 items-center gap-space-sm self-stretch border-t border-t-transparent pt-space-sm pl-3">
          <span className="flex flex-1 items-center gap-space-sm text-base font-bold"><AppLogo className="size-6" /><span className="font-brand text-xl leading-none font-normal text-foreground/85 translate-y-1">Folio</span></span>
          {collapseButton}
        </div>
        {separator}
      </>}
      {/* Search on top, then Sync, File manager, Assets and Graph: plain items like the others */}
      <Button variant="ghost" tooltip={hint('Search')} tooltipSide="right" className={cn('justify-start gap-3 font-normal', collapsed && 'size-control justify-center px-0')} onClick={onSearch}>
        <MagnifyingGlass /> {label('Search')}
      </Button>
      {renderSync(collapsed)}
      {pages.filter(p => p.id === PAGE.FILES).map(p => <div key={p.id}>{pageButton(p)}</div>)}
      <Button variant="ghost" tooltip={hint('Assets')} tooltipSide="right" aria-current={page === PAGE.ASSETS ? 'page' : undefined} className={item(PAGE.ASSETS)} onClick={() => onPage(PAGE.ASSETS)}>
        <Images /> {label('Assets')}
      </Button>
      {pages.filter(p => p.id === PAGE.GRAPH).map(p => <div key={p.id}>{pageButton(p)}</div>)}
      {separator}
      {pages.filter(p => p.view).map(p => (
        <div key={p.id} className="group relative">
          {pageButton(p)}
          {!collapsed && (
            <div className="absolute inset-y-0 right-1 flex items-center">
              <ViewMenu view={p} disabled={!viewActions.canEdit} onRename={viewActions.onRename} onDelete={viewActions.onDelete} />
            </div>
          )}
        </div>
      ))}
      <Button variant="ghost" tooltip={hint('Views settings')} tooltipSide="right" disabled={!viewActions.canEdit} className={cn('justify-start gap-3 font-normal', collapsed && 'size-control justify-center px-0')} onClick={viewActions.onSettings}>
        <SlidersHorizontal /> {label('Views settings')}
      </Button>
      <div className="flex-1" />
      {separator}
      <Button variant="ghost" tooltip={hint('Broken links')} tooltipSide="right" aria-current={page === PAGE.LINKS ? 'page' : undefined} className={cn(item(PAGE.LINKS), 'relative')} onClick={() => onPage(PAGE.LINKS)}>
        <LinkBreak /> {label('Broken links')}
        {menu.brokenCount > 0 && (collapsed
          ? <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-muted-foreground" aria-label={`${menu.brokenCount} broken`} />
          : <span className="ml-auto text-muted-foreground">{menu.brokenCount}</span>)}
      </Button>
      <Button variant="ghost" tooltip={hint('Documentation')} tooltipSide="right" aria-current={page === PAGE.DOCS ? 'page' : undefined} className={item(PAGE.DOCS)} onClick={() => onPage(PAGE.DOCS)}>
        <BookOpen /> {label('Documentation')}
      </Button>
      <Button variant="ghost" tooltip={hint('Settings')} tooltipSide="right" aria-current={page === PAGE.SETTINGS ? 'page' : undefined} className={item(PAGE.SETTINGS)} onClick={() => onPage(PAGE.SETTINGS)}>
        <Gear /> {label('Settings')}
      </Button>
      <Button variant="ghost" tooltip={hint('Sign out')} tooltipSide="right" className={cn('justify-start gap-3 font-normal text-destructive-ink', collapsed && 'size-control justify-center px-0')} onClick={menu.onSignOut}>
        <SignOut /> {label('Sign out')}
      </Button>
      {!collapsed && <ResizeHandle label="Resize menu" size={width} limits={RAIL_WIDTH} onResize={resize} className="inset-y-space" />}
    </nav>
  )
}

// Phones: a bar at the top with ☰ (every page, then the rest), Search and Sync. It slides away while
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
      <AccountMenu
        {...menu} current={page} pages={pages} viewActions={viewActions} onNavigate={onPage}
        trigger={
          <Button variant="ghost-outline" size="icon" aria-label="Menu">
            <List />
          </Button>
        }
      />
      <Button variant="ghost-outline" size="icon" aria-label="Search" onClick={onSearch}>
        <MagnifyingGlass />
      </Button>
      <div className="flex-1" />
      {renderSync(false, true)}
    </div>
    </div>
    </nav>
    </div>
  )
}
