import { useState } from 'react'
import { List, SidebarSimple, MagnifyingGlass, LinkBreak, Gear, SignOut, TreeView, Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import AccountMenu from './AccountMenu.jsx'
import { NavDrawerButton } from './NavTree.jsx'
import { PAGE } from '../lib/pages.js'
import { storage } from '../lib/storage.js'
import { RAIL_WIDTH } from '../lib/resize.js'
import { useResizableWidth } from '../hooks/useResizableWidth.js'
import ResizeHandle from './ResizeHandle.jsx'
import { useHideOnScroll } from '../hooks/useHideOnScroll.js'
import AppLogo from './AppLogo.jsx'
import ViewMenu from './ViewMenu.jsx'

// The open page's button: light accent fill, accent text
const ACTIVE = 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary'

// The app's primary navigation, in place of a header. `menu`: brokenCount and
// onSignOut; `page` the open page; `renderSync(compact)` makes the SyncButton.
// Desktop (768px+): a left rail, 16px from the top like the content boxes, 24px (--space-lg) on the left and
// bottom; on the right its own 8px and the content's 16px gutter. On top a header shaped like a title bar
// (8px padding and a 1px top edge like the boxes' outline, around a 40px row, then the separator as its bottom
// border, level with the title bars' borders): the app's name (Folio, bold) and a button that collapses
// the rail to icons only (remembered on this device; expanded, its edge is a drag handle), and after it,
// while the file tree is hidden, `onShowTree`'s tree button (collapsed: first under the separator); 16px; Sync, Search right under it (a plain item), a separator, the views, Add view, a separator, File manager, Graph, and at the bottom Broken links (count),
// Settings and Sign out.
// `pages`: the main pages (lib/pages.js): the views, then Add view, a separator, File manager and Graph. With a
// mouse, a view shows its ⋯ (Rename / Delete: `viewActions`) on hover; the collapsed rail has none, and Add view is an icon.
export function NavRail({ page, pages, viewActions, onPage, onSearch, renderSync, menu, onShowTree }) {
  const [collapsed, setCollapsed] = useState(storage.getRailCollapsed)
  const [width, resize] = useResizableWidth(RAIL_WIDTH, storage.getRailWidth, storage.setRailWidth)
  const toggle = () => { setCollapsed(!collapsed); storage.setRailCollapsed(!collapsed) }
  const item = id => cn('justify-start gap-3 font-normal', collapsed && 'size-control justify-center px-0', page === id && ACTIVE)
  // A rail button: icon, and its label unless collapsed (then the label is the tooltip)
  const label = text => collapsed ? <span className="sr-only">{text}</span> : text
  const hint = text => collapsed ? text : undefined
  const treeButton = onShowTree && (
    <Button variant="ghost-outline" size="icon" aria-label="Show file tree" tooltip="Show file tree" className="shrink-0 border-muted-foreground/50" onClick={onShowTree}>
      <TreeView />
    </Button>
  )
  const pageButton = p => (
    <Button variant="ghost" tooltip={hint(p.title)} tooltipSide="right" aria-current={page === p.id ? 'page' : undefined} className={cn(item(p.id), !collapsed && 'w-full', !collapsed && p.view && 'pr-10')} onClick={() => onPage(p.id)}>
      <p.icon /> {collapsed ? label(p.title) : <span className="min-w-0 truncate">{p.title}</span>}
    </Button>
  )
  // my-3 + the 4px gap = 16px (--space) on both sides
  const separator = <div role="separator" className="my-3 h-px w-full shrink-0 bg-border" />
  return (
    <nav aria-label="Main" style={collapsed ? undefined : { width }} className={cn('relative hidden md:flex shrink-0 flex-col gap-1 pt-space pb-space-lg pl-space-lg pr-space-sm', collapsed ? 'items-center' : 'max-w-[25vw]')}>
      <div className={cn('flex shrink-0 items-center gap-space-sm self-stretch border-t border-b border-t-transparent border-b-border py-space-sm', collapsed ? 'justify-center' : 'pl-3')}>
        {!collapsed && <span className="flex flex-1 items-center gap-2 text-base font-bold"><AppLogo className="size-6" />Folio</span>}
        <Button variant="ghost" size="icon" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} tooltip={collapsed ? 'Expand menu' : 'Collapse menu'} aria-expanded={!collapsed} className="group shrink-0 focus-visible:bg-secondary" onClick={toggle}>
          {/* Collapsed, the logo stands in for the button until it's hovered or focused */}
          {collapsed && <AppLogo className="size-6 group-hover:hidden group-focus-visible:hidden" />}
          <SidebarSimple className={cn(collapsed && 'hidden group-hover:block group-focus-visible:block')} />
        </Button>
        {!collapsed && treeButton}
      </div>
      <div className="h-2" /> {/* + the 4px gaps = 16px */}
      <div className={cn('flex flex-col gap-space', collapsed && 'items-center')}>
        {collapsed && treeButton}
        {renderSync(collapsed)}
      </div>
      {/* Search right under Sync (the items' 4px gap), a plain item like the others */}
      <Button variant="ghost" tooltip={hint('Search')} tooltipSide="right" className={cn('justify-start gap-3 font-normal', collapsed && 'size-control justify-center px-0')} onClick={onSearch}>
        <MagnifyingGlass /> {label('Search')}
      </Button>
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
      <Button variant="ghost" tooltip={hint('Add view')} tooltipSide="right" disabled={!viewActions.canEdit} className={cn('justify-start gap-3 font-normal', collapsed && 'size-control justify-center px-0')} onClick={viewActions.onAdd}>
        <Plus /> {label('Add view')}
      </Button>
      {separator}
      {pages.filter(p => !p.view).map(p => <div key={p.id}>{pageButton(p)}</div>)}
      <div className="flex-1" />
      {separator}
      <Button variant="ghost" tooltip={hint('Broken links')} tooltipSide="right" aria-current={page === PAGE.LINKS ? 'page' : undefined} className={cn(item(PAGE.LINKS), 'relative')} onClick={() => onPage(PAGE.LINKS)}>
        <LinkBreak /> {label('Broken links')}
        {menu.brokenCount > 0 && (collapsed
          ? <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-muted-foreground" aria-label={`${menu.brokenCount} broken`} />
          : <span className="ml-auto text-muted-foreground">{menu.brokenCount}</span>)}
      </Button>
      <Button variant="ghost" tooltip={hint('Settings')} tooltipSide="right" aria-current={page === PAGE.SETTINGS ? 'page' : undefined} className={item(PAGE.SETTINGS)} onClick={() => onPage(PAGE.SETTINGS)}>
        <Gear /> {label('Settings')}
      </Button>
      <Button variant="ghost" tooltip={hint('Sign out')} tooltipSide="right" className={cn('justify-start gap-3 font-normal text-destructive', collapsed && 'size-control justify-center px-0')} onClick={menu.onSignOut}>
        <SignOut /> {label('Sign out')}
      </Button>
      {!collapsed && <ResizeHandle label="Resize menu" width={width} limits={RAIL_WIDTH} onResize={resize} className="inset-y-space-lg" />}
    </nav>
  )
}

// Phones: a bar at the top with ☰ (every page, then the rest), the file-tree
// button (`tree`: on the main pages), Search and Sync. It slides away while
// the content scrolls down and returns on scrolling up (`useHideOnScroll`).
export function TopBar({ host, resetKey, page, pages, viewActions, onPage, onSearch, renderSync, menu, tree }) {
  const hidden = useHideOnScroll(host, resetKey)
  return (
    <div className={cn('grid shrink-0 transition-[grid-template-rows,visibility] duration-200 md:hidden', hidden ? 'grid-rows-[0fr] invisible' : 'grid-rows-[1fr]')}>
    <nav aria-label="Main" className="min-h-0 overflow-hidden">
    <div className="flex items-center gap-2 px-space-sm py-space">
      <AccountMenu
        {...menu} current={page} pages={pages} viewActions={viewActions} onNavigate={onPage}
        trigger={
          <Button variant="ghost-outline" size="icon" aria-label="Menu" className="shrink-0 border-muted-foreground/50">
            <List />
          </Button>
        }
      />
      {tree && <NavDrawerButton />}
      <Button variant="ghost-outline" size="icon" aria-label="Search" className="shrink-0 border-muted-foreground/50" onClick={onSearch}>
        <MagnifyingGlass />
      </Button>
      <div className="flex-1" />
      {renderSync(false)}
    </div>
    </nav>
    </div>
  )
}
