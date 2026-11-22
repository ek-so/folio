import { createContext, useContext } from 'react'

// What App gives the title bar, its folder tree and whatever acts on the open repo: `listDir(dir)`, `symlinks`, the
// `current` path (open file or folder), the open `file` (null for a folder), `dir` (the open folder, or the open file's),
// `onOpenFolder` / `onOpenFile` (each row's ⋯ is ItemMenu, as in File manager), the title bar's `history` (Back and
// Forward: useAddressBar), `viewTree()` (on a view's page: its widgets and what they show, as nodes; null elsewhere),
// the open `repo` (share links, RepoMenu), the `repos` used on this device and `onSwitchRepo(repo)`.
export const NavContext = createContext(null)

export const useNav = () => useContext(NavContext)
