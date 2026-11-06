import { CalendarBlank } from '@phosphor-icons/react'
import { Badge } from './ui/badge.jsx'

// A date in a note's text (lib/dates.js), as a badge in the line like a link's: a calendar, then the date as
// "17 Oct 2026, 14:30" (its spot, a <time>, holds the machine-readable date). Not editable yet
export default function DateBadge({ label }) {
  return (
    <Badge className="h-control-sm gap-1.5 whitespace-nowrap py-0 pl-2 align-middle text-foreground/75">
      <CalendarBlank className="size-4 shrink-0 text-primary" />
      {label}
    </Badge>
  )
}
