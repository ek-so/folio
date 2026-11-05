import { Badge } from './ui/badge.jsx'
import { valueList } from '../lib/frontmatter.js'

// A note's properties (lib/frontmatter.js) as badges, one per value, without the
// property's name (its tooltip has it); empty ones aren't shown. `props`: [{ key, value }].
// Used in the note's preview and on board cards.
export default function PropertyBadges({ props, className }) {
  const badges = props.flatMap(({ key, value }) => valueList(value).map((v, i) => [`${key}:${i}`, key, v]))
  if (!badges.length) return null
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-space-xs">
        {badges.map(([id, key, value]) => (
          <Badge key={id} title={`${key}: ${value}`}>
            <span className="truncate">{value}</span>
          </Badge>
        ))}
      </div>
    </div>
  )
}
