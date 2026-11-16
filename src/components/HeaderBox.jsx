import { Separator } from './ui/separator.jsx'

// An outlined box with a header split from its content by a line from edge to edge: a note's broken links
// (BrokenLinkList), an update in Recent updates. shadcn's Card brings its own sizes and spacing; this keeps ours.
export default function HeaderBox({ header, children }) {
  return (
    <section className="flex flex-col rounded-lg border border-border bg-card">
      <div className="p-space-xs">{header}</div>
      <Separator />
      <div className="p-space-xs">{children}</div>
    </section>
  )
}
