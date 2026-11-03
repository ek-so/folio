// Address bar <-> open view. A view is { file, folder }: a file path, or a
// folder path ('' is the repo root). The URL is `base` + the path, with a
// trailing slash for folders.

const encode = p => p.split('/').map(encodeURIComponent).join('/')

export function urlForView(base, { file, folder }) {
  if (file) return base + encode(file)
  return folder ? base + encode(folder) + '/' : base
}

// The view a pathname names, or null if it can't be read
export function viewForUrl(base, pathname) {
  if (!pathname.startsWith(base)) return null
  let path
  try { path = pathname.slice(base.length).split('/').map(decodeURIComponent).join('/') } catch { return null }
  if (path === '' || path.endsWith('/')) return { file: null, folder: path.replace(/\/$/, '') }
  return { file: path, folder: path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '' }
}

// `view` limited to what exists: a missing file opens its folder, a missing
// folder its nearest existing parent. `files` are paths, `folders` the
// folder paths ('' always exists).
export function existingView({ file, folder }, files, folders) {
  if (file && files.has(file)) return { file, folder }
  const known = new Set(folders)
  while (folder && !known.has(folder)) folder = folder.includes('/') ? folder.slice(0, folder.lastIndexOf('/')) : ''
  return { file: null, folder }
}
