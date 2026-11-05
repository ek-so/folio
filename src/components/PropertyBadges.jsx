import { Badge } from './ui/badge.jsx'
import { valueList } from '../lib/frontmatter.js'

// A note's properties (lib/frontmatter.js) as badges; empty ones aren't shown. `props`: [{ key, value }].
// `keys` (the note's preview): one badge per property, its name then its values; without it
// (board cards) one badge per value, no names.
export default function PropertyBadges({ props, keys, className }) {
  const badges = props.flatMap(({ key, value }) => {
    const values = valueList(value)
    if (!values.length) return []
    return keys ? [[key, key, values.join(', ')]] : values.map((v, i) => [`${key}:${i}`, key, v])
  })
  if (!badges.length) return null
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-space-xs">
        {badges.map(([id, key, value]) => (
          <Badge key={id} title={`${key}: ${value}`}>
            {keys && <span className="shrink-0 text-muted-foreground">{key}</span>}
            <span className="truncate">{value}</span>
          </Badge>
        ))}
      </div>
    </div>
  )
}
