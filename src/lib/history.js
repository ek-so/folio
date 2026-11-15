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

// A commit for the page: { sha, date, files, mine } (`mine`: pushed from this device, `pushed` the shas it pushed)
export const commitEntry = (commit, files, pushed) => ({
  sha: commit.sha, date: commit.date, files: shownFiles(files), mine: pushed.includes(commit.sha),
})

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

const dayKey = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// The day a date falls on, as a title: Today, Yesterday, "3 Nov", or "3 Nov 2025" in another year
export function dayTitle(date, now = new Date()) {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (dayKey(date) === dayKey(now)) return 'Today'
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday'
  return `${date.getDate()} ${MONTHS[date.getMonth()]}${date.getFullYear() === now.getFullYear() ? '' : ` ${date.getFullYear()}`}`
}

// The commits with files to show, grouped by the day they were made (local time): [{ title, commits }]
export function historyDays(commits, now = new Date()) {
  const days = []
  for (const c of commits) {
    if (!c.files.length) continue
    const title = dayTitle(new Date(c.date), now)
    if (days.at(-1)?.title === title) days.at(-1).commits.push(c)
    else days.push({ title, commits: [c] })
  }
  return days
}

// A commit's time of day, "14:05"
export const timeOf = date => { const d = new Date(date); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
