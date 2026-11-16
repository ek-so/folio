import { Separator } from './ui/separator.jsx'
import { Button } from './ui/button.jsx'

// An outlined box: a small muted title row (like the rail's Views title, as tall as a row) split from its content
// (ListRows) by a line from edge to edge. The title row: `icon` (lined up with the rows' icons), `title`, then `meta`
// (muted, on the right: an update's time) and `action` (a medium icon button, its edge in line with the rows' ⋯).
// `onOpen`: the icon and title are a button (a note's broken links: the note). Used by Recent updates (an update) and
// BrokenLinkList (a note). shadcn's Card brings its own sizes and spacing; this keeps ours.
export default function HeaderBox({ icon, title, meta, action, onOpen, children }) {
  const label = <>{icon}<span className="min-w-0 truncate">{title}</span></>
  return (
    <section className="flex flex-col rounded-lg border border-border bg-card">
      <div className="mx-space-xs flex min-h-control min-w-0 items-center gap-space-sm pl-3 pr-space-sm text-xs font-medium text-muted-foreground">
        {onOpen
          ? <Button variant="ghost-quiet" size="sm" className="-ml-2 min-w-0 gap-space-sm text-xs" onClick={onOpen}>{label}</Button>
          : <span className="flex min-w-0 items-center gap-space-sm">{label}</span>}
        <span className="flex-1" />
        {meta && <span className="shrink-0 tabular-nums">{meta}</span>}
        {action}
      </div>
      <Separator />
      <div className="p-space-xs">{children}</div>
    </section>
  )
}
