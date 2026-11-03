import { ArrowUp, ArrowDown, Check, X, CloudSlash, CaretDown, Trash } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'

const LOOK = {
  idle: { variant: 'ghost-outline', label: 'Sync' },
  done: { variant: 'success', label: 'Synced', Icon: Check },
  error: { variant: 'destructive', label: 'Failed', Icon: X },
  offline: { variant: 'ghost-outline', label: 'Offline', Icon: CloudSlash },
}

// Accent pill at the end of a menu item: what there is to push or pull
function MenuBadge({ children }) {
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
      {children}
    </span>
  )
}

// Split Sync button in the header, next to Search and ⋯, faded like them: the main part syncs; ▾ opens
// Push (with change count), Pull (how many files changed on GitHub, or New
// when unknown) and Discard. An accent badge on Sync shows the directions
// there's something to sync in (↑ push, ↓ pull, or both), without counts.
export default function SyncButton({ syncState, syncing, changeCount, incoming, onSync, onPull, onDiscard }) {
  const { variant, label, Icon } = LOOK[syncState] || LOOK.idle
  const hasPush = changeCount > 0
  const hasPull = incoming !== null

  return (
    <div className="flex shrink-0">
      <Button onClick={onSync} disabled={syncing} variant={variant} className="gap-2 rounded-r-none">
        {syncing ? (
          <span className="size-4 rounded-full border border-current border-t-transparent animate-spin opacity-60" />
        ) : Icon ? (
          <Icon />
        ) : null}
        {label}
        {syncState === 'idle' && !syncing && (hasPush || hasPull) && (
          <span
            aria-label={[hasPush && 'Changes to push', hasPull && 'Changes to pull'].filter(Boolean).join(', ')}
            className="flex h-5 items-center gap-0.5 rounded-full bg-primary px-1.5 text-primary-foreground [&_svg]:size-3"
          >
            {hasPush && <ArrowUp weight="bold" />}
            {hasPull && <ArrowDown weight="bold" />}
          </span>
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" disabled={syncing} aria-label="Sync options" className="rounded-l-none border-l border-background">
            <CaretDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
          <DropdownMenuItem disabled={!hasPush} onSelect={onSync}>
            <ArrowUp /> Push changes
            {hasPush && <MenuBadge>{changeCount}</MenuBadge>}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!hasPull} onSelect={onPull}>
            <ArrowDown /> Pull changes
            {hasPull && <MenuBadge>{incoming.files ? (incoming.files >= 300 ? '300+' : incoming.files) : 'New'}</MenuBadge>}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={!hasPush} onSelect={onDiscard}>
            <Trash /> Discard changes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
