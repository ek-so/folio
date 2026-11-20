import { ArrowUp } from '@phosphor-icons/react'
import { Tip } from './ui/tooltip.jsx'
import { cn } from '@/lib/utils.js'

// Pieces Recent updates and Version history share.

// An update's ↑ (this device's, accent; `quiet`: not synced yet, muted) or ↓ (muted), its meaning in a tooltip
export function Direction({ icon: Icon, tip, quiet }) {
  return (
    <Tip content={tip}>
      <span className={cn('flex shrink-0', Icon === ArrowUp && !quiet ? 'text-primary' : 'text-muted-foreground')} aria-label={tip} role="img"><Icon className="size-4" /></span>
    </Tip>
  )
}

// A line about what's shown (offline, couldn't load), with its icon and an optional `action` on its right
export function Notice({ icon: Icon, children, action }) {
  return (
    <div className="flex items-center gap-space-sm rounded-sm bg-secondary/60 px-3 py-space-sm text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0" /> <span className="flex-1">{children}</span> {action}
    </div>
  )
}
