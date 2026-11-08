// File manager's Columns layout: the folders its three columns list, the open folder last, preceded by
// its parents (the root is ''); a folder near the root leaves the columns after it empty (null).
export function columnFolders(path, count = 3) {
  const parts = path.split('/').filter(Boolean)
  const chain = ['', ...parts.map((_, i) => parts.slice(0, i + 1).join('/'))]
  const shown = chain.slice(-count)
  return [...shown, ...Array(count - shown.length).fill(null)]
}
