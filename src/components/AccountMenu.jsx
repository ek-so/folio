import { List, Gear, SignOut, LinkBreak } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from './ui/dropdown-menu.jsx'

// ☰ at the left of every file screen's header, opening the account popover.
// The account and repo are shown in Settings.
export default function AccountMenu({ onSettings, brokenCount, onBrokenLinks, onSignOut }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost-outline" size="icon" aria-label="Account and settings" className="shrink-0 border-muted-foreground/50">
          <List />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64" onCloseAutoFocus={e => e.preventDefault()}>
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
