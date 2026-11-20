// Version history of a note: its versions on GitHub, one per commit that changed it, following its renames back, and
// what changed in one compared with the one before it.
import { matches } from './merge.js'
import { blocksOf } from './markdown.js'
import { frontMatter, properties } from './frontmatter.js'

// The version of the note at `path` a commit made, from the commit's files (github.js `commitFiles`): { sha, date, path,
// status ('added' | 'modified' | 'renamed'), from (a rename's old path), blob (its text's sha; may be missing) }, or null
// when the commit removed it there (what was at that path before is another note)
export function versionOf(commit, files, path) {
  const f = files.find(x => x.path === path)
  if (!f || f.status === 'removed') return null
  return {
    sha: commit.sha, date: commit.date, path,
    status: f.status === 'renamed' ? 'renamed' : f.status === 'added' || f.status === 'copied' ? 'added' : 'modified',
    ...(f.status === 'renamed' && f.from ? { from: f.from } : {}),
    ...(f.sha ? { blob: f.sha } : {}),
  }
}

// The versions in a page of a path's commits (newest first, each with its files), up to where the note started there:
// { versions, next }. `next`: where the older ones are, { path, from, skip } (the commits of `path` from the commit
// `from` on, without `skip`), or null when there are none: the note was added, or what was at `path` before was another
// note. A rename goes on with the old path; `more`: whether `path` has older commits than these.
export function versionsIn(page, path, more) {
  const versions = []
  for (const { commit, files } of page) {
    const v = versionOf(commit, files, path)
    if (!v) return { versions, next: null }
    versions.push(v)
    if (v.status === 'added') return { versions, next: null }
    if (v.status === 'renamed') return { versions, next: v.from ? { path: v.from, from: v.sha, skip: v.sha } : null }
  }
  const last = page.at(-1)
  return { versions, next: more && last ? { path, from: last.commit.sha, skip: last.commit.sha } : null }
}

// A version as it shows with what changed since the one before (`before`, '' when it's the first): its note with the
// removed blocks put back where they were, `text`, and `marks` ({ offset: 'added' | 'removed' }) at the start of each
// block that changed, for the preview to color (a changed block shows as the old one removed and the new one added).
// Blocks of different kinds are kept apart by an empty HTML comment, so a removed list item doesn't join an added
// list. The front matter is the version's own. `props`: the properties that changed (added, removed or a new value).
export function diffNote(before, after) {
  const a = blocksOf(before), b = blocksOf(after)
  const parts = []
  let i = 0, j = 0
  const upTo = (ti, tj) => {
    while (i < ti) parts.push({ raw: a[i++], kind: 'removed' })
    while (j < tj) parts.push({ raw: b[j++], kind: 'added' })
  }
  for (const [pi, pj] of matches(a, b)) {
    upTo(pi, pj)
    parts.push({ raw: b[pj], kind: null })
    i = pi + 1; j = pj + 1
  }
  upTo(a.length, b.length)
  const fm = frontMatter(after)
  let text = fm ? after.slice(0, fm.end) : ''
  const marks = {}
  parts.forEach((p, k) => {
    if (k > 0) text += p.kind !== parts[k - 1].kind ? '\n\n<!-- -->\n\n' : '\n\n'
    if (p.kind) marks[text.length] = p.kind
    text += p.raw
  })
  const was = properties(before), is = properties(after)
  const props = [...new Set([...Object.keys(was), ...Object.keys(is)])]
    .filter(k => JSON.stringify(was[k]) !== JSON.stringify(is[k]))
  return { text, marks, props }
}
