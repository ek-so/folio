// The Graph page's data: every file and folder of the repo as a node, each joined to its folder by a line
// (`kind: 'folder'`, the root's to the repo's node, ''), and a line for each link between two of them (`kind: 'link'`,
// one per pair, whichever way). Left out: the config (.folio), the archive and dot files (.gitkeep).
import { isConfigPath } from './viewsConfig.js'
import { inArchive } from './archive.js'
import { fileKind, displayName } from './files.js'

const parentOf = path => path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
const hidden = path => isConfigPath(path) || inArchive(path) || path.split('/').pop().startsWith('.')

// `files`: { path: anything } (the repo's files); `backlinks`: target path → [{ from }] (lib/links.js buildIndex);
// `repoName`: the root's name. Nodes: { id (its path; '' the root), name, kind: 'note' | 'file' | 'folder' | 'root' }
export function graphData(files, backlinks, repoName) {
  const nodes = new Map([['', { id: '', name: repoName, kind: 'root' }]])
  const edges = []
  const addFolder = path => {
    if (nodes.has(path)) return
    nodes.set(path, { id: path, name: displayName(path), kind: 'folder' })
    addFolder(parentOf(path))
    edges.push({ source: parentOf(path), target: path, kind: 'folder' })
  }
  for (const path of Object.keys(files).sort()) {
    if (hidden(path)) continue
    nodes.set(path, { id: path, name: displayName(path).replace(/\.md$/, ''), kind: fileKind(path) === 'note' ? 'note' : 'file' })
    addFolder(parentOf(path))
    edges.push({ source: parentOf(path), target: path, kind: 'folder' })
  }
  const pairs = new Set()
  for (const [target, from] of Object.entries(backlinks)) {
    for (const { from: source } of from) {
      const key = [source, target].sort().join('\n')
      if (source === target || pairs.has(key) || !nodes.has(source) || !nodes.has(target)) continue
      pairs.add(key)
      edges.push({ source, target, kind: 'link' })
    }
  }
  return { nodes: [...nodes.values()], edges }
}
