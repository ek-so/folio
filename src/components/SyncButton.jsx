import { ArrowUp, ArrowDown, ArrowsClockwise, X, CloudSlash, Trash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu.jsx'

const LOOK = {
  idle: { label: 'Sync' },
  error: { label: 'Failed', Icon: X },
  offline: { label: 'Offline', Icon: CloudSlash },
}

// Accent pill at the end of a menu item: what there is to push or pull
function MenuBadge({ children }) {
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
      {children}
    </span>
  )
}

// Sync in the navigation: one button that opens the sync menu: Sync all (its
// badge the total to push and pull, "7+" or New when GitHub can't count), a
// separator, Push (change count), Pull (files changed on GitHub, or New) and
// Discard. In the rail (`bar` false) it's a plain item like Search: the icon
// and "Sync" (`compact`, the collapsed rail: the icon alone, the label its
// tooltip), with an accent badge at its end for the directions there's something
// to sync in (↑ push, ↓ pull, or both; collapsed: a dot). `bar` (the phone's
// top bar): an icon button filled like its neighbours, with the dot. Failed and
// Offline flash in place of the icon and label.
export default function SyncButton({ className, compact, bar, syncState, syncing, changeCount, incoming, onSync, onPull, onDiscard }) {
  const { label, Icon } = LOOK[syncState] || LOOK.idle
  const failed = syncState === 'error'
  const hasPush = changeCount > 0
  const hasPull = incoming !== null
  const directions = [hasPush && 'Changes to push', hasPull && 'Changes to pull'].filter(Boolean).join(', ')
  // Files to pull: a number, or null when GitHub can't compare (New); it lists at most 300
  const pullCount = hasPull && incoming.files ? incoming.files : null
  const pullLabel = pullCount === null ? 'New' : pullCount >= 300 ? '300+' : pullCount
  const pushPull = (hasPush ? changeCount : 0) + (pullCount ?? 0)
  const totalLabel = hasPull && (pullCount === null || pullCount >= 300) ? (pushPull ? `${pushPull}+` : 'New') : pushPull
  const pending = syncState === 'idle' && !syncing && (hasPush || hasPull)
  const StateIcon = Icon || ArrowsClockwise
  const icon = syncing ? <span className="size-4 rounded-full border border-current border-t-transparent animate-spin opacity-60" /> : <StateIcon />
  const iconOnly = compact || bar
  const dot = pending && <span aria-label={directions} className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {bar ? (
          <Button variant="ghost-outline" size="icon" disabled={syncing} aria-label={label} className={cn('relative', failed && 'text-destructive-ink', className)}>
            {icon}{dot}
          </Button>
        ) : (
          <Button
            variant="ghost"
            disabled={syncing}
            aria-label={iconOnly ? label : undefined}
            tooltip={compact ? label : undefined}
            tooltipSide="right"
            className={cn('relative justify-start gap-3 font-normal', compact && 'size-control justify-center px-0', failed && 'text-destructive-ink hover:text-destructive-ink', className)}
          >
            {icon}
            {compact ? dot : <>
              {label}
              {pending && (
                <span aria-label={directions} className="ml-auto flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full bg-primary px-space-xs text-primary-foreground">
                  {hasPush && <ArrowUp weight="bold" className="size-3" />}
                  {hasPull && <ArrowDown weight="bold" className="size-3" />}
                </span>
              )}
            </>}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={bar ? 'end' : 'start'} onCloseAutoFocus={e => e.preventDefault()}>
        <DropdownMenuItem disabled={syncing} onSelect={onSync}>
          <ArrowsClockwise /> Sync all
          {(hasPush || hasPull) && <MenuBadge>{totalLabel}</MenuBadge>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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
    </DropdownMenu>
  )
}
