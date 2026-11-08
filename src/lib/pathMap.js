// Settings kept per file or folder path ({ path: value }: the emoji icons, when assets were added) follow what they
// belong to: `movedMap` after the file or folder (`isDir`) at `from` moved to `to`, `removedMap` once it's deleted
// (a new one at that path starts without).

const within = (p, path, isDir) => p === path || (isDir && p.startsWith(path + '/'))

export const movedMap = (map, from, to, isDir) =>
  Object.fromEntries(Object.entries(map).map(([p, v]) => [within(p, from, isDir) ? to + p.slice(from.length) : p, v]))

export const removedMap = (map, path, isDir) => Object.fromEntries(Object.entries(map).filter(([p]) => !within(p, path, isDir)))
