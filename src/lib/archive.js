import { properties, withValue } from './frontmatter.js'
import { valueDate } from './markdown.js'
import { formatDate } from './dates.js'

// Done notes are moved out of the way into ARCHIVE at the repo's root (a planner's Mark as done), each with
// `status: done` and the day it was archived; when Folio opens, the ones archived more than KEEP_DAYS ago are
// removed as local changes (shown before Sync, so they can still be discarded).
export const ARCHIVE = '.archive'
export const ARCHIVED = 'archived'
export const KEEP_DAYS = 30

// `text` marked done on `day` ({ year, month, day })
export const markedDone = (text, day) => withValue(withValue(text, 'status', 'done'), ARCHIVED, formatDate(day))

const utc = ({ year, month, day }) => Date.UTC(year, month - 1, day)

// The paths of `notes` ({ path: text }) in ARCHIVE whose `archived` day is more than KEEP_DAYS before `today` ({ year, month, day })
export function staleArchived(notes, today) {
  return Object.entries(notes).filter(([path, text]) => {
    if (!path.startsWith(ARCHIVE + '/')) return false
    const value = properties(text)[ARCHIVED]
    const day = typeof value === 'string' ? valueDate(value) : null
    return day?.year !== undefined && (utc(today) - utc(day)) / 86400000 > KEEP_DAYS
  }).map(([path]) => path)
}
