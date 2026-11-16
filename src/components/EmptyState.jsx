import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'

// A widget's empty or broken state, in its place: a short muted `message` and, with `action` ({ label, icon, onClick,
// disabled }), a button to put it right (Select folder when a planner's or board's folder is gone, Select note when a
// Pinned widget's card is). Its own component as no other one is a message with a button in a widget.
// Every empty state's emoji, one per kind of nothing, so the same kind always looks the same (EmptyMessage's `emoji`)
export const EMPTY = {
  sorted: '🌱', // a planner's day with nothing left to do
  found: '🔍', // a search that found nothing
  recent: '🕘', // nothing opened lately
  folder: '📂', // an empty folder or view
  notes: '📝', // no notes in the repo yet
  files: '🖼️', // no uploads yet
  values: '🏷️', // a property with no values yet
  list: '📭', // a list with nothing in it (views, widgets, columns, properties)
  pinned: '📌', // nothing pinned
  updates: '🕊️', // no updates
  graph: '🌌', // nothing to draw
  links: '✨', // no broken links
}

// A muted line for what a list or page has nothing of (No files found, No values yet), centered, under its `emoji`
// (EMPTY; errors and offline messages have none); `size`: its air above and below: sm in a dialog's or popover's
// list (a smaller emoji), md in a widget (default), lg as a page's whole content
const AIR = { sm: 'py-space', md: 'py-space-lg', lg: 'py-12' }
export function EmptyMessage({ emoji, size = 'md', className, children }) {
  return (
    <div className={cn('flex flex-col items-center gap-space-xs text-center', AIR[size], className)}>
      {emoji && <span aria-hidden="true" className={size === 'sm' ? 'text-xl' : 'text-2xl'}>{emoji}</span>}
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}

export default function EmptyState({ message, action }) {
  return (
    <div className="flex flex-col items-center gap-space-sm py-space-lg">
      <EmptyMessage className="py-0">{message}</EmptyMessage>
      {action && <Button variant="secondary" disabled={action.disabled} onClick={action.onClick}>{action.icon}{action.label}</Button>}
    </div>
  )
}

// A white box in a tray (like a card's look) for a day with nothing to do: an EmptyMessage with its `emoji`
export function EmptyBox({ emoji, children }) {
  return (
    <div className="rounded-lg border border-border bg-card px-space py-space-lg">
      <EmptyMessage emoji={emoji} className="py-0">{children}</EmptyMessage>
    </div>
  )
}
