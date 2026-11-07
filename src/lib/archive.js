import { withValue } from './frontmatter.js'

// What's removed (a file, a note, a folder; a planner's card marked done) isn't deleted: it moves into ARCHIVE at the
// repo's root, into a folder for the day it was archived (`.archive/2026-11-07/haircut.md`), so a file or folder carries
// its day without a property. When Folio opens, the day folders older than KEEP_DAYS are removed as local changes (shown
// before Sync, so they can still be discarded). Removing something that's already in the archive deletes it for good.
export const ARCHIVE = '.archive'
export const KEEP_DAYS = 30

const pad = n => String(n).padStart(2, '0')

// The archive's folder for `day` ({ year, month, day }): ".archive/2026-11-07"
export const archiveDay = ({ year, month, day }) => `${ARCHIVE}/${year}-${pad(month)}-${pad(day)}`

// Whether `path` is the archive or in it
export const inArchive = path => path === ARCHIVE || path.startsWith(ARCHIVE + '/')

// A planner card's `text` marked done before it's archived
export const markedDone = text => withValue(text, 'status', 'done')

const utc = ({ year, month, day }) => Date.UTC(year, month - 1, day)

// The archive's day folders, among the folders of `paths` (every file's path), older than KEEP_DAYS on `today` ({ year, month, day })
export function staleArchiveDays(paths, today) {
  const stale = new Set()
  for (const path of paths) {
    const m = path.match(/^\.archive\/(\d{4})-(\d{2})-(\d{2})\//)
    if (m && (utc(today) - utc({ year: +m[1], month: +m[2], day: +m[3] })) / 86400000 > KEEP_DAYS) stale.add(`${ARCHIVE}/${m[1]}-${m[2]}-${m[3]}`)
  }
  return [...stale]
}
