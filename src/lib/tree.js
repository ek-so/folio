// Folders that must be open for `path` to be visible in the file tree: all of
// its parents, and the folder itself when `isDir`.
export function foldersToOpen(path, isDir) {
  const parts = path.split('/').filter(Boolean)
  const upto = isDir ? parts.length : parts.length - 1
  return Array.from({ length: upto }, (_, i) => parts.slice(0, i + 1).join('/'))
}
