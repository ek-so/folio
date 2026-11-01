import { List, Gear, SignOut, LinkBreak } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from './ui/dropdown-menu.jsx'

// Home header's left side: ☰ owner / repo, opening the account popover.
// The account is shown in Settings; the header already names the owner.
export default function AccountMenu({ repo, onSettings, brokenCount, onBrokenLinks, onSignOut }) {
  const [owner, name] = repo.split('/')
  return (
    <DropdownMenu>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost-outline" size="icon" aria-label="Account and settings" className="shrink-0 -ml-2 border-muted-foreground/50">
            <List />
          </Button>
        </DropdownMenuTrigger>
        <span className="truncate text-base select-none">
          <span className="text-muted-foreground">{owner} / </span>
          <span className="font-bold">{name}</span>
        </span>
      </div>
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
