import { useState } from 'react'
import { Check, Gear, SignOut, LinkBreak, BookOpen, Plus } from '@phosphor-icons/react'
import { cn } from '../lib/utils.js'
import { PAGE } from '../lib/pages.js'
import ViewMenu from './ViewMenu.jsx'
import PageTitle from './PageTitle.jsx'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from './ui/dropdown-menu.jsx'

// Open page's item: light accent fill, accent text
const ACTIVE = 'bg-primary/15 text-primary-ink pointer-fine:hover:bg-primary/20 focus-visible:bg-primary/20 focus:text-primary-ink'

// The phone navigation's popover, opened by `trigger` (a Button): the main
// pages (`pages`): File manager, then the views and Add view, then Graph, then Broken links (count), Settings
// and Sign out. `current` is the open page, checked. A view has its ⋯ (`ViewMenu`: Rename / Remove
// in a separate menu beside it, `viewActions`; the nav never swaps its own content for a nested screen). The account and repo are shown in Settings.
export default function AccountMenu({ trigger, current, pages, viewActions, onNavigate, brokenCount, onSignOut }) {
  const [open, setOpen] = useState(false)
  const mark = id => current === id && <Check className="ml-auto" />
  const fixedItem = p => (
    <DropdownMenuItem key={p.id} className={current === p.id ? ACTIVE : undefined} onSelect={() => onNavigate(p.id)}>
      <p.icon /> <PageTitle page={p} />{mark(p.id)}
    </DropdownMenuItem>
  )
  // Inside a menu item: the view's ⋯ must not select the item
  const own = { onClick: e => e.stopPropagation(), onPointerUp: e => e.stopPropagation(), onKeyDown: e => e.stopPropagation() }
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60" onCloseAutoFocus={e => e.preventDefault()}>
        {pages.filter(p => p.id === PAGE.FILES).map(fixedItem)}
        <DropdownMenuSeparator />
        {pages.filter(p => p.view).map(p => (
          <DropdownMenuItem key={p.id} className={current === p.id ? ACTIVE : undefined} onSelect={() => onNavigate(p.id)}>
            <p.icon /> <span className="min-w-0 truncate"><PageTitle page={p} /></span>{mark(p.id)}
            <span className={cn('-my-1 -mr-2', current !== p.id && 'ml-auto')} {...own}>
              <ViewMenu sub view={p} disabled={!viewActions.canEdit} onRename={v => { setOpen(false); viewActions.onRename(v) }} onDelete={v => { setOpen(false); viewActions.onDelete(v) }} />
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem disabled={!viewActions.canEdit} onSelect={viewActions.onAdd}><Plus /> Add view</DropdownMenuItem>
        <DropdownMenuSeparator />
        {pages.filter(p => !p.view && p.id !== PAGE.FILES).map(fixedItem)}
        <DropdownMenuSeparator />
        <DropdownMenuItem className={current === PAGE.LINKS ? ACTIVE : undefined} onSelect={() => onNavigate(PAGE.LINKS)}>
          <LinkBreak /> Broken links
          {brokenCount > 0 && <span className="ml-auto pl-4 text-muted-foreground">{brokenCount}</span>}
          {current === PAGE.LINKS && !brokenCount && mark(PAGE.LINKS)}
        </DropdownMenuItem>
        <DropdownMenuItem className={current === PAGE.DOCS ? ACTIVE : undefined} onSelect={() => onNavigate(PAGE.DOCS)}><BookOpen /> Documentation{mark(PAGE.DOCS)}</DropdownMenuItem>
        <DropdownMenuItem className={current === PAGE.SETTINGS ? ACTIVE : undefined} onSelect={() => onNavigate(PAGE.SETTINGS)}><Gear /> Settings{mark(PAGE.SETTINGS)}</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onSignOut}><SignOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
