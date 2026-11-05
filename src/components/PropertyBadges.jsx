import { cn } from '@/lib/utils'
import { Badge } from './ui/badge.jsx'
import { valueList, DESCRIPTION } from '../lib/frontmatter.js'

// A note's properties (lib/frontmatter.js): its description as muted text
// (`clamp`: cut after three lines), then the others as badges, one per value,
// without the property's name (its tooltip has it); empty ones aren't shown.
// `props`: [{ key, value }]. Used in the note's preview and on board cards.
export default function PropertyBadges({ props, clamp, className }) {
  const description = valueList(props.find(p => p.key === DESCRIPTION)?.value ?? '').join(', ')
  const badges = props.filter(p => p.key !== DESCRIPTION)
    .flatMap(({ key, value }) => valueList(value).map((v, i) => [`${key}:${i}`, key, v]))
  if (!description && !badges.length) return null
  return (
    <div className={cn('flex flex-col gap-space-sm', className)}>
      {description && <p className={cn('break-words text-sm text-muted-foreground', clamp && 'line-clamp-3')}>{description}</p>}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-space-xs">
          {badges.map(([id, key, value]) => (
            <Badge key={id} title={`${key}: ${value}`}>
              <span className="truncate">{value}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
