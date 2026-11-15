// Recent updates: the commits on GitHub, newest first, and the changes on this device not synced yet. The app's own
// settings (`.folio/`) are left out, and a commit that changed only them isn't listed.

import { isConfigPath } from './viewsConfig.js'
import { inArchive } from './archive.js'

const KEEP = '/.gitkeep'

// Files as the page lists them: no settings; a file moved into the archive (Remove) is `archived` at its old path; a
// folder's placeholder file (".gitkeep") stands for its folder (`folder`)
export const shownFiles = files => files
  .filter(f => !isConfigPath(f.path))
  .map(f => f.status === 'renamed' && inArchive(f.path) && !inArchive(f.from) ? { path: f.from, status: 'archived' } : f)
  .map(f => f.path.endsWith(KEEP) || f.path === '.gitkeep' ? { ...f, path: f.path.slice(0, -KEEP.length) || '', folder: true } : f)
  .filter(f => f.path)

// A commit for the page: { sha, date, files } (whether this device pushed it is worked out when it's shown)
export const commitEntry = (commit, files) => ({ sha: commit.sha, date: commit.date, files: shownFiles(files) })

// The local changes (lib/changes.js) as files: [{ path, status, from }]
export function unsyncedFiles(ch) {
  const files = Object.keys(ch.base).map(orig => {
    const target = orig in ch.moves ? ch.moves[orig] : orig
    if (target === null) return { path: orig, status: 'removed' }
    if (ch.base[orig] === null) return { path: target, status: 'added' }
    if (target !== orig) return { path: target, status: 'renamed', from: orig }
    return { path: target, status: 'modified' }
  })
  return shownFiles(files).sort((a, b) => a.path.localeCompare(b.path))
}

// `list` (newest first) with `page` (newer, newest first) on top: what `page` has replaces the same commits in `list`;
// `list`'s older ones stay only when `page` reaches them (no gap between)
export function mergedHistory(page, list) {
  if (!page.length) return list
  const at = list.findIndex(c => c.sha === page.at(-1).sha)
  return at === -1 ? page : [...page, ...list.slice(at + 1)]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

// The commits with files to show
export const shownCommits = commits => commits.filter(c => c.files.length)

// When a commit was made, as its update shows it: "Today, 13:32", "Jun 13, 14:39", "Jun 13 2025, 14:39" in another year
export function whenLabel(date, now = new Date()) {
  const d = new Date(date)
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (sameDay(d, now)) return `Today, ${time}`
  return `${MONTHS[d.getMonth()]} ${d.getDate()}${d.getFullYear() === now.getFullYear() ? '' : ` ${d.getFullYear()}`}, ${time}`
}
