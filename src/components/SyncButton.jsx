import { ArrowUp, ArrowDown, Check, X, CloudSlash, CaretDown, Trash } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'

const LOOK = {
  idle: { variant: 'ghost-outline', label: 'Sync' },
  done: { variant: 'success', label: 'Synced', Icon: Check },
  error: { variant: 'destructive', label: 'Failed', Icon: X },
  offline: { variant: 'ghost-outline', label: 'Offline', Icon: CloudSlash },
}

// Split Sync button, faded like Search and ⋯: the main part syncs; ▾ opens
// Push (with change count), Pull (marked New when GitHub is ahead) and
// Discard. An accent dot shows when there's anything to push or pull.
export default function SyncButton({ syncState, syncing, changeCount, remoteAhead, onSync, onPull, onDiscard }) {
  const { variant, label, Icon } = LOOK[syncState] || LOOK.idle
  const hasPush = changeCount > 0
  const hasPull = remoteAhead

  return (
    <div className="flex">
      <Button onClick={onSync} disabled={syncing} variant={variant} className="relative gap-2 rounded-r-none">
        {syncing ? (
          <span className="size-4 rounded-full border border-current border-t-transparent animate-spin opacity-60" />
        ) : Icon ? (
          <Icon />
        ) : null}
        {label}
        {syncState === 'idle' && (hasPush || hasPull) && (
          <span aria-label="Something to sync" className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" disabled={syncing} aria-label="Sync options" className="rounded-l-none border-l border-background">
            <CaretDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onCloseAutoFocus={e => e.preventDefault()}>
          <DropdownMenuItem disabled={!hasPush} onSelect={onSync}>
            <ArrowUp /> Push changes
            {hasPush && <span className="ml-auto pl-4 text-muted-foreground">{changeCount}</span>}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!hasPull} onSelect={onPull}>
            <ArrowDown /> Pull changes
            {hasPull && <span className="ml-auto pl-4 text-muted-foreground">New</span>}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={!hasPush} onSelect={onDiscard}>
            <Trash /> Discard changes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
