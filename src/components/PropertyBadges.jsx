import { cn } from '@/lib/utils'
import { Badge } from './ui/badge.jsx'
import { Tip } from './ui/tooltip.jsx'
import { valueList, DESCRIPTION } from '../lib/frontmatter.js'
import { inlineHtml } from '../lib/previewLinks.js'

// A note's properties (lib/frontmatter.js), in the file's order: its
// description as muted text with its markdown links (`path`: the note's, `files`:
// the repo's, for relative links; whoever shows this opens them: see
// `openLink`) (`clamp`: cut after three lines), the others as
// badges, one per value, without the property's name (its tooltip has it), so
// badges listed before the description show above it and the rest below.
// Empty ones aren't shown. `props`: [{ key, value }]. `title`: in a box with
// that small title on top, on a light grey fill with badges in the card's color (the note's preview); without it, bare (board cards).
export default function PropertyBadges({ props, path, files, clamp, title, className }) {
  const parts = [] // [{ text }] or [{ badges: [[id, key, value]] }], in order
  for (const { key, value } of props) {
    const values = valueList(value)
    if (!values.length) continue
    if (key === DESCRIPTION) { parts.push({ text: values.join(', ') }); continue }
    if (!parts.at(-1)?.badges) parts.push({ badges: [] })
    parts.at(-1).badges.push(...values.map((v, i) => [`${key}:${i}`, key, v]))
  }
  if (!parts.length) return null
  const body = parts.map((part, i) => part.text
    ? <p
        key={i}
        className={cn('md-inline break-words text-sm text-muted-foreground', clamp && 'line-clamp-3')}
        dangerouslySetInnerHTML={{ __html: inlineHtml(part.text, path, files) }}
      />
    : (
      <div key={i} className="flex flex-wrap gap-space-xs">
        {part.badges.map(([id, key, value]) => (
          <Tip key={id} content={`${key}: ${value}`}>
            <Badge className={cn(title && 'bg-card')}><span className="truncate">{value}</span></Badge>
          </Tip>
        ))}
      </div>
    ))
  if (!title) return <div className={cn('flex flex-col gap-space-sm', className)}>{body}</div>
  return (
    <div className={className}>
      <section className="flex flex-col gap-space-sm rounded-lg bg-secondary/50 p-space-sm">
        <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
        {body}
      </section>
    </div>
  )
}
