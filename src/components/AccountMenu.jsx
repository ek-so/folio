import { Check, Gear, SignOut, LinkBreak } from '@phosphor-icons/react'
import { PAGE, MAIN_PAGES } from '../lib/pages.js'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from './ui/dropdown-menu.jsx'

// The navigation's popover, opened by `trigger` (a Button): with `pages`, the
// main pages first (on phones), then Broken links (count), Settings and Sign
// out. `current` is the open page, checked. The account and repo are shown in Settings.
export default function AccountMenu({ trigger, pages, current, onNavigate, brokenCount, onSignOut, align = 'start' }) {
  const mark = id => current === id && <Check className="ml-auto" />
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64" onCloseAutoFocus={e => e.preventDefault()}>
        {pages && MAIN_PAGES.map(({ id, title, icon: Icon }) => (
          <DropdownMenuItem key={id} onSelect={() => onNavigate(id)}><Icon /> {title}{mark(id)}</DropdownMenuItem>
        ))}
        {pages && <DropdownMenuSeparator />}
        <DropdownMenuItem onSelect={() => onNavigate(PAGE.LINKS)}>
          <LinkBreak /> Broken links
          {brokenCount > 0 && <span className="ml-auto pl-4 text-muted-foreground">{brokenCount}</span>}
          {current === PAGE.LINKS && !brokenCount && mark(PAGE.LINKS)}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onNavigate(PAGE.SETTINGS)}><Gear /> Settings{mark(PAGE.SETTINGS)}</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onSignOut}><SignOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
