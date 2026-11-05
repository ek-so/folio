import { useState } from 'react'
import { Check, Gear, SignOut, LinkBreak, DotsThree, Plus, PencilSimple, Trash, ArrowLeft } from '@phosphor-icons/react'
import { PAGE } from '../lib/pages.js'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from './ui/dropdown-menu.jsx'

// Open page's item: light accent fill, accent text
const ACTIVE = 'bg-primary/15 text-primary pointer-fine:hover:bg-primary/20 focus-visible:bg-primary/20 focus:text-primary'

// The phone navigation's popover, opened by `trigger` (a Button): the main
// pages (`pages`): the views and Add view, then File manager and Graph, then Broken links (count), Settings
// and Sign out. `current` is the open page, checked. A view has its ⋯ (the menu turns into
// that view's Rename / Delete: `viewActions`). The account and repo are shown in Settings.
export default function AccountMenu({ trigger, current, pages, viewActions, onNavigate, brokenCount, onSignOut }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null) // the view whose actions the menu shows
  const mark = id => current === id && <Check className="ml-auto" />
  // Inside a menu item: the button must not select the item
  const own = fn => e => { e.preventDefault(); e.stopPropagation(); fn() }
  return (
    <DropdownMenu open={open} onOpenChange={o => { setOpen(o); if (!o) setEditing(null) }}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64" onCloseAutoFocus={e => e.preventDefault()}>
        {editing ? (
          <>
            <DropdownMenuItem onSelect={e => { e.preventDefault(); setEditing(null) }}><ArrowLeft /> <span className="min-w-0 truncate">{editing.title}</span></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!viewActions.canEdit} onSelect={() => viewActions.onRename(editing)}><PencilSimple /> Rename</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" disabled={!viewActions.canEdit} onSelect={() => viewActions.onDelete(editing)}><Trash /> Delete</DropdownMenuItem>
          </>
        ) : (
          <>
            {pages.filter(p => p.view).map(p => (
              <DropdownMenuItem key={p.id} className={current === p.id ? ACTIVE : undefined} onSelect={() => onNavigate(p.id)}>
                <p.icon /> <span className="min-w-0 truncate">{p.title}</span>{mark(p.id)}
                <button type="button" aria-label={`Actions for ${p.title}`} className={`flex size-control-md shrink-0 items-center justify-center rounded-sm ${current === p.id ? '' : 'ml-auto'}`} onClick={own(() => setEditing(p))}><DotsThree weight="bold" size={16} /></button>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem disabled={!viewActions.canEdit} onSelect={viewActions.onAdd}><Plus /> Add view</DropdownMenuItem>
            <DropdownMenuSeparator />
            {pages.filter(p => !p.view).map(p => (
              <DropdownMenuItem key={p.id} className={current === p.id ? ACTIVE : undefined} onSelect={() => onNavigate(p.id)}>
                <p.icon /> {p.title}{mark(p.id)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className={current === PAGE.LINKS ? ACTIVE : undefined} onSelect={() => onNavigate(PAGE.LINKS)}>
              <LinkBreak /> Broken links
              {brokenCount > 0 && <span className="ml-auto pl-4 text-muted-foreground">{brokenCount}</span>}
              {current === PAGE.LINKS && !brokenCount && mark(PAGE.LINKS)}
            </DropdownMenuItem>
            <DropdownMenuItem className={current === PAGE.SETTINGS ? ACTIVE : undefined} onSelect={() => onNavigate(PAGE.SETTINGS)}><Gear /> Settings{mark(PAGE.SETTINGS)}</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onSignOut}><SignOut /> Sign out</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
