import { LockSimple } from '@phosphor-icons/react'

// The small lock before a locked note's title on a card or a list row (smaller than the usual 16px icon: it sits in the title's line)
export default function LockMark() {
  return <LockSimple aria-label="Locked" className="mr-space-xs inline size-3.5 align-[-0.125em] text-muted-foreground" />
}
