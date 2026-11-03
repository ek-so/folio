import { List, House, FolderOpen, Graph, Gear, SignOut, LinkBreak } from '@phosphor-icons/react'
import { PAGE, MAIN_PAGES } from '../lib/pages.js'
import { Button } from './ui/button.jsx'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from './ui/dropdown-menu.jsx'

const ICONS = { [PAGE.HOME]: House, [PAGE.FILES]: FolderOpen, [PAGE.GRAPH]: Graph }

// ☰ at the left of every main screen's header (Home, File manager, Graph), opening the popover: those pages, then the account items.
// The account and repo are shown in Settings.
export default function AccountMenu({ onNavigate, onSettings, brokenCount, onBrokenLinks, onSignOut }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost-outline" size="icon" aria-label="Account and settings" className="shrink-0 border-muted-foreground/50">
          <List />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64" onCloseAutoFocus={e => e.preventDefault()}>
        {MAIN_PAGES.map(({ id, title }) => {
          const Icon = ICONS[id]
          return <DropdownMenuItem key={id} onSelect={() => onNavigate(id)}><Icon /> {title}</DropdownMenuItem>
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onBrokenLinks}>
          <LinkBreak /> Broken links
          {brokenCount > 0 && <span className="ml-auto pl-4 text-muted-foreground">{brokenCount}</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSettings}><Gear /> Settings</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onSignOut}><SignOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
