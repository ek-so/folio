import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'

// A widget's empty or broken state, in its place: a short muted `message` and, with `action` ({ label, icon, onClick,
// disabled }), a button to put it right (Select folder when a planner's or board's folder is gone, Select note when a
// notes widget's note is). Its own component as no other one is a message with a button in a widget.
// A muted line for what a list or page has nothing of (No files found, No values yet), centered; `size`: its air
// above and below: sm in a dialog's or popover's list, md in a widget (default), lg as a page's whole content
const AIR = { sm: 'py-space', md: 'py-space-lg', lg: 'py-12' }
export function EmptyMessage({ size = 'md', className, children }) {
  return <p className={cn('text-center text-sm text-muted-foreground', AIR[size], className)}>{children}</p>
}

export default function EmptyState({ message, action }) {
  return (
    <div className="flex flex-col items-center gap-space-sm py-space-lg">
      <EmptyMessage className="py-0">{message}</EmptyMessage>
      {action && <Button variant="secondary" disabled={action.disabled} onClick={action.onClick}>{action.icon}{action.label}</Button>}
    </div>
  )
}
