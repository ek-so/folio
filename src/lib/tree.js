// Folders that must be open for `path` to be visible in the file tree: all of
// its parents, and the folder itself when `isDir`.
export function foldersToOpen(path, isDir) {
  const parts = path.split('/').filter(Boolean)
  const upto = isDir ? parts.length : parts.length - 1
  return Array.from({ length: upto }, (_, i) => parts.slice(0, i + 1).join('/'))
}

// Desktop tree panel width in px: default, limits, and a saved value kept inside them
export const TREE_WIDTH = { default: 256, min: 200, max: 480 }
export function clampTreeWidth(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || value === null || value === '') return TREE_WIDTH.default
  return Math.min(TREE_WIDTH.max, Math.max(TREE_WIDTH.min, Math.round(n)))
}
