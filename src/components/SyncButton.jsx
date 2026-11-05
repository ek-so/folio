import { ArrowUp, ArrowDown, ArrowsClockwise, X, CloudSlash, CaretDown, Trash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu.jsx'

const LOOK = {
  idle: { variant: 'ghost-outline', label: 'Sync' },
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

// Sync in the navigation (the rail, or the phone's floating panel). A split
// button: the main part syncs; ▾ opens Push (with change count), Pull (how many
// files changed on GitHub, or New when unknown) and Discard. An accent badge on
// Sync shows the directions there's something to sync in (↑ push, ↓ pull, or
// both), without counts. `compact` (the collapsed rail): one icon button (a dot
// for changes) that opens the same menu with Sync all on top, its badge the
// total of both ("7+" or New when GitHub can't say how many), then a separator.
export default function SyncButton({ className, compact, syncState, syncing, changeCount, incoming, onSync, onPull, onDiscard }) {
  const { variant, label, Icon } = LOOK[syncState] || LOOK.idle
  const hasPush = changeCount > 0
  const hasPull = incoming !== null
  const directions = [hasPush && 'Changes to push', hasPull && 'Changes to pull'].filter(Boolean).join(', ')
  // Files to pull: a number, or null when GitHub can't compare (New); it lists at most 300
  const pullCount = hasPull && incoming.files ? incoming.files : null
  const pullLabel = pullCount === null ? 'New' : pullCount >= 300 ? '300+' : pullCount
  const pushPull = (hasPush ? changeCount : 0) + (pullCount ?? 0)
  const totalLabel = hasPull && (pullCount === null || pullCount >= 300) ? (pushPull ? `${pushPull}+` : 'New') : pushPull
  const spinner = <span className="size-4 rounded-full border border-current border-t-transparent animate-spin opacity-60" />

  const menu = (
    <DropdownMenuContent align={compact ? 'start' : 'end'} onCloseAutoFocus={e => e.preventDefault()}>
      {compact && (
        <>
          <DropdownMenuItem disabled={syncing} onSelect={onSync}>
            <ArrowsClockwise /> Sync all
            {(hasPush || hasPull) && <MenuBadge>{totalLabel}</MenuBadge>}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuItem disabled={!hasPush} onSelect={onSync}>
        <ArrowUp /> Push changes
        {hasPush && <MenuBadge>{changeCount}</MenuBadge>}
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!hasPull} onSelect={onPull}>
        <ArrowDown /> Pull changes
        {hasPull && <MenuBadge>{pullLabel}</MenuBadge>}
      </DropdownMenuItem>
      <DropdownMenuItem variant="destructive" disabled={!hasPush} onSelect={onDiscard}>
        <Trash /> Discard changes
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  if (compact) {
    const StateIcon = Icon || ArrowsClockwise
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" disabled={syncing} aria-label={label} tooltip={label} className={cn('relative shrink-0', className)}>
            {syncing ? spinner : <StateIcon />}
            {syncState === 'idle' && !syncing && (hasPush || hasPull) && (
              <span aria-label={directions} className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
            )}
          </Button>
        </DropdownMenuTrigger>
        {menu}
      </DropdownMenu>
    )
  }

  return (
    <div className={cn('flex shrink-0', className)}>
      <Button onClick={onSync} disabled={syncing} variant={variant} className="flex-1 gap-2 rounded-r-none">
        {syncing ? spinner : Icon ? <Icon /> : null}
        {label}
        {syncState === 'idle' && !syncing && (hasPush || hasPull) && (
          <span
            aria-label={directions}
            className="flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full bg-primary px-1 text-primary-foreground"
          >
            {hasPush && <ArrowUp weight="bold" className="size-3" />}
            {hasPull && <ArrowDown weight="bold" className="size-3" />}
          </span>
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" disabled={syncing} aria-label="Sync options" className="rounded-l-none border-l border-background">
            <CaretDown />
          </Button>
        </DropdownMenuTrigger>
        {menu}
      </DropdownMenu>
    </div>
  )
}
