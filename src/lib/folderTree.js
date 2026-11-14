// The rows of a folder tree, for picking a folder: `folders` are repo paths ('' is the root, left
// out: the sheet shows it itself). A folder whose parents aren't listed still shows them, but as
// rows that can't be picked (`pickable: false`). A folder's children show only while it's in
// `expanded` (a Set of paths). Each row: { path, name, depth, branch, open, pickable }, a folder
// before its children, siblings by name.
export function folderRows(folders, expanded) {
  const listed = new Set(folders.filter(Boolean))
  const all = new Set()
  for (const f of listed) {
    const parts = f.split('/')
    for (let i = 1; i <= parts.length; i++) all.add(parts.slice(0, i).join('/'))
  }
  const parent = p => p.slice(0, Math.max(p.lastIndexOf('/'), 0))
  const kids = new Map()
  for (const p of all) kids.set(parent(p), [...(kids.get(parent(p)) ?? []), p])
  const rows = []
  const walk = (dir, depth) => {
    for (const path of (kids.get(dir) ?? []).sort((a, b) => a.localeCompare(b))) {
      const branch = kids.has(path)
      const open = branch && expanded.has(path)
      rows.push({ path, name: path.slice(path.lastIndexOf('/') + 1), depth, branch, open, pickable: listed.has(path) })
      if (open) walk(path, depth + 1)
    }
  }
  walk('', 0)
  return rows
}
