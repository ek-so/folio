import { useState } from 'react'
import { List, SidebarSimple, MagnifyingGlass, LinkBreak, Gear, SignOut, TreeView } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import AccountMenu from './AccountMenu.jsx'
import { NavDrawerButton } from './NavTree.jsx'
import { PAGE, MAIN_PAGES } from '../lib/pages.js'
import { storage } from '../lib/storage.js'
import { RAIL_WIDTH } from '../lib/resize.js'
import { useResizableWidth } from '../hooks/useResizableWidth.js'
import ResizeHandle from './ResizeHandle.jsx'
import AppLogo from './AppLogo.jsx'

// The open page's button: light accent fill, accent text
const ACTIVE = 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary'

// The app's primary navigation, in place of a header. `menu`: brokenCount and
// onSignOut; `page` the open page; `renderSync(compact)` makes the SyncButton.
// Desktop (768px+): a left rail, 16px from the top like the content boxes, 24px (--space-lg) on the left and
// bottom; on the right its own 8px and the content's 16px gutter. On top a header shaped like a title bar
// (8px padding and a 1px top edge like the boxes' outline, around a 40px row, then the separator as its bottom
// border, level with the title bars' borders): the app's name (Folio, bold) and a button that collapses
// the rail to icons only (remembered on this device; expanded, its edge is a drag handle), and after it,
// while the file tree is hidden, `onShowTree`'s tree button (collapsed: first under the separator); 16px; Sync and Search (16px apart); 16px; Home, File manager, Graph, and at the bottom Broken links (count),
// Settings and Sign out.
export function NavRail({ page, onPage, onSearch, renderSync, menu, onShowTree }) {
  const [collapsed, setCollapsed] = useState(storage.getRailCollapsed)
  const [width, resize] = useResizableWidth(RAIL_WIDTH, storage.getRailWidth, storage.setRailWidth)
  const toggle = () => { setCollapsed(!collapsed); storage.setRailCollapsed(!collapsed) }
  const item = id => cn('justify-start gap-3 font-normal', collapsed && 'size-control justify-center px-0', page === id && ACTIVE)
  // A rail button: icon, and its label unless collapsed (then the label is the tooltip)
  const label = text => collapsed ? <span className="sr-only">{text}</span> : text
  const hint = text => collapsed ? text : undefined
  const treeButton = onShowTree && (
    <Button variant="ghost-outline" size="icon" aria-label="Show file tree" title="Show file tree" className="shrink-0 border-muted-foreground/50" onClick={onShowTree}>
      <TreeView />
    </Button>
  )
  return (
    <nav aria-label="Main" style={collapsed ? undefined : { width }} className={cn('relative hidden md:flex shrink-0 flex-col gap-1 pt-space pb-space-lg pl-space-lg pr-space-sm', collapsed ? 'items-center' : 'max-w-[25vw]')}>
      <div className={cn('flex shrink-0 items-center gap-space-sm self-stretch border-t border-b border-t-transparent border-b-border py-space-sm', collapsed ? 'justify-center' : 'pl-3')}>
        {!collapsed && <span className="flex flex-1 items-center gap-2 text-base font-bold"><AppLogo className="size-6" />Folio</span>}
        <Button variant="ghost" size="icon" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} title={collapsed ? 'Expand menu' : 'Collapse menu'} aria-expanded={!collapsed} className="group shrink-0 focus-visible:bg-secondary" onClick={toggle}>
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
        <Button variant="outline" title={hint('Search')} className={cn('justify-start gap-3 px-3 font-normal text-muted-foreground shadow-sm hover:bg-transparent hover:text-foreground', collapsed && 'size-control justify-center px-0')} onClick={onSearch}>
          <MagnifyingGlass /> {label('Search')}
        </Button>
      </div>
      <div className="h-2" /> {/* + the 4px gaps = 16px */}
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
      {!collapsed && <ResizeHandle label="Resize menu" width={width} limits={RAIL_WIDTH} onResize={resize} className="inset-y-space-lg" />}
    </nav>
  )
}

// Phones: a bar at the top with ☰ (every page, then the rest), the file-tree
// button (`tree`: on the main pages), Search and Sync.
export function TopBar({ page, onPage, onSearch, renderSync, menu, tree }) {
  return (
    <nav aria-label="Main" className="flex shrink-0 items-center gap-2 p-space-sm md:hidden">
      <AccountMenu
        {...menu} current={page} onNavigate={onPage}
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
    </nav>
  )
}
