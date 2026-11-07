import { resolveImage } from './markdown.js'
import { displayName } from './files.js'

// Internal markdown links between files in the repo: finding them, the
// backlink / broken-link index, and rewriting them when files move.
// Only regular markdown links — [text](path), ![alt](path) and reference
// definitions [id]: path. Links inside code are ignored.

const INLINE_LINK = /(!?)\[([^\]\n]*)\]\([ \t]*(<[^>\n]*>|[^)\s]+)(?:[ \t]+"[^"\n]*")?[ \t]*\)/dg
const REF_DEF = /^ {0,3}\[[^\]\n]+\]:[ \t]*(<[^>\n]*>|\S+)/dgm
const FENCE = /^ {0,3}(`{3,}|~{3,})/
// An inline code span: a run of backticks, up to the next run of the same length
const CODE_SPAN = /(`+)(?!`)[^\n]*?(?<!`)\1(?!`)/g

// Same text with code (fenced blocks, inline spans) blanked out, so offsets
// still match the original. A fence closes only with the same character, at least as many
function maskCode(md) {
  let open = null // the fence that opened the block we're in
  return md.split(/(?<=\n)/).map(line => {
    const blank = () => line.replace(/[^\n]/g, ' ')
    const fence = line.match(FENCE)?.[1]
    if (open) {
      if (fence && fence[0] === open[0] && fence.length >= open.length && !line.slice(line.indexOf(fence) + fence.length).trim()) open = null
      return blank()
    }
    if (fence) { open = fence; return blank() }
    return line.replace(CODE_SPAN, m => ' '.repeat(m.length))
  }).join('')
}

// Every link in a note: { target, angle, targetStart, targetEnd,
// text, textStart, textEnd } (text is null for reference definitions).
// `target` is the path as written, without <…>.
export function extractLinks(md) {
  const masked = maskCode(md)
  const links = []
  for (const m of masked.matchAll(INLINE_LINK)) {
    const [ts, te] = m.indices[3]
    const [xs, xe] = m.indices[2]
    links.push(link(md, ts, te, { text: md.slice(xs, xe), textStart: xs, textEnd: xe }))
  }
  for (const m of masked.matchAll(REF_DEF)) {
    const [ts, te] = m.indices[1]
    links.push(link(md, ts, te, { text: null }))
  }
  return links.sort((a, b) => a.targetStart - b.targetStart)
}

function link(md, ts, te, rest) {
  const raw = md.slice(ts, te)
  const angle = raw.startsWith('<')
  return { target: angle ? raw.slice(1, -1) : raw, angle, targetStart: ts, targetEnd: te, ...rest }
}

// What a repo path points to: { kind: 'note' | 'file' | 'folder', path },
// or null. Links may omit ".md".
export function linkTarget(repoPath, files) {
  for (const candidate of [repoPath, repoPath + '.md']) {
    if (files[candidate]) return { kind: candidate.endsWith('.md') ? 'note' : 'file', path: candidate }
  }
  if (Object.keys(files).some(p => p.startsWith(repoPath + '/'))) return { kind: 'folder', path: repoPath }
  return null
}

// Git stores a symlink as a blob with this mode; its content is the target path
export const SYMLINK_MODE = '120000'

// Where the symlink at `linkPath` (content `target`) points in `files`:
// { kind: 'note' | 'file' | 'folder', path }, or { error: 'outside' } (absolute,
// or above the repo root) or { error: 'missing' }. A link to a link is followed.
export function resolveSymlink(linkPath, target, files, texts = {}, hops = 0) {
  const raw = target.trim()
  if (!raw || raw.startsWith('/') || hops > 5) return { error: hops > 5 ? 'missing' : 'outside' }
  const parts = linkPath.split('/').slice(0, -1)
  for (const seg of raw.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') { if (!parts.length) return { error: 'outside' }; parts.pop() }
    else parts.push(seg)
  }
  const path = parts.join('/')
  const entry = files[path]
  if (entry?.mode === SYMLINK_MODE) {
    return texts[path] === undefined ? { error: 'missing' } : resolveSymlink(path, texts[path], files, texts, hops + 1)
  }
  if (entry) return { kind: path.endsWith('.md') ? 'note' : 'file', path }
  if (Object.keys(files).some(p => p.startsWith(path + '/'))) return { kind: 'folder', path }
  return { error: 'missing' }
}

const lineAt = (md, offset) => {
  const start = md.lastIndexOf('\n', offset - 1) + 1
  const end = md.indexOf('\n', offset)
  return md.slice(start, end === -1 ? md.length : end).trim()
}

// Backlinks (target path -> [{ from, line }]) and broken links
// ([{ from, line, link }]) across all `notes` ({ path: text }).
export function buildIndex(notes, files) {
  const backlinks = {}
  const broken = []
  for (const [from, text] of Object.entries(notes)) {
    for (const l of extractLinks(text)) {
      const repoPath = resolveImage(from, l.target)
      if (repoPath === null) continue
      const target = linkTarget(repoPath, files)
      const line = lineAt(text, l.targetStart)
      if (!target) broken.push({ from, line, link: l })
      else if (target.path !== from) (backlinks[target.path] ||= []).push({ from, line })
    }
  }
  return { backlinks, broken }
}

const dirOf = path => path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
const baseOf = path => path.split('/').pop()

function relative(fromDir, to) {
  const from = fromDir ? fromDir.split('/') : []
  const parts = to.split('/')
  let common = 0
  while (common < from.length && common < parts.length - 1 && from[common] === parts[common]) common++
  return [...Array(from.length - common).fill('..'), ...parts.slice(common)].join('/')
}

const safeDecode = s => { try { return decodeURI(s) } catch { return s } }

// `newPath` written as a link from `notePath`, in the style of `oldTarget`:
// relative or /absolute, ./ prefix, with or without ".md", encoded or <…>,
// keeping any #anchor or ?query.
function formatTarget(oldTarget, angle, newPath, notePath) {
  const cut = oldTarget.search(/[?#]/)
  const oldPath = cut === -1 ? oldTarget : oldTarget.slice(0, cut)
  const suffix = cut === -1 ? '' : oldTarget.slice(cut)
  let out = oldPath.startsWith('/') ? '/' + newPath : relative(dirOf(notePath), newPath)
  if (oldPath.startsWith('./') && !out.startsWith('../')) out = './' + out
  if (!/\.md$/i.test(safeDecode(oldPath)) && /\.md$/.test(out)) out = out.slice(0, -3)
  if (angle) return `<${out}${suffix}>`
  const encode = oldPath.includes('%') || /\s/.test(out)
  return (encode ? encodeURI(out) : out) + suffix
}

// `text` of the note that was at `oldNotePath` and is now at `newNotePath`,
// after files moved as described by `mapPath(oldPath) -> newPath`. Links are
// resolved against `files` from before the move. Link text equal to the old
// name (with or without extension) becomes the new name.
export function rewriteLinks(text, oldNotePath, newNotePath, mapPath, files) {
  let out = text
  for (const l of extractLinks(text).reverse()) {
    const repoPath = resolveImage(oldNotePath, l.target)
    if (repoPath === null) continue
    const target = linkTarget(repoPath, files)
    const oldPath = target ? target.path : repoPath
    const newPath = mapPath(oldPath)
    if (newPath === oldPath && newNotePath === oldNotePath) continue
    const written = formatTarget(l.target, l.angle, newPath, newNotePath)
    const raw = out.slice(l.targetStart, l.targetEnd)
    if (written !== raw) out = out.slice(0, l.targetStart) + written + out.slice(l.targetEnd)
    if (l.text !== null && baseOf(newPath) !== baseOf(oldPath)) {
      const renamed = l.text === displayName(oldPath) ? displayName(newPath)
        : l.text === baseOf(oldPath) ? baseOf(newPath) : null
      if (renamed !== null) out = out.slice(0, l.textStart) + renamed + out.slice(l.textEnd)
    }
  }
  return out
}

// Point one broken link (from extractLinks on `text`) at `newPath`.
export function retargetLink(text, notePath, l, newPath) {
  const written = formatTarget(l.target, l.angle, newPath, notePath)
  return text.slice(0, l.targetStart) + written + text.slice(l.targetEnd)
}

// The one file a broken link probably meant: same name (".md" optional)
// somewhere else in the repo. Null if none or several match.
export function suggestFix(l, files) {
  const cut = l.target.search(/[?#]/)
  const name = baseOf(safeDecode(cut === -1 ? l.target : l.target.slice(0, cut)))
  if (!name) return null
  const matches = Object.keys(files).filter(p => baseOf(p) === name || baseOf(p) === name + '.md')
  return matches.length === 1 ? matches[0] : null
}
