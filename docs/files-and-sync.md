# Files, links and sync

## Item actions
Rename / Move / Remove for any file or folder (the only way to rename) go through `ItemMenu` (⋯) on list rows, tree rows and the title bar. A file's ⋯ also has Duplicate: a copy next to it ("x 2.md", `freePath`), a note's text with " (copy)" after its title (`copyTitled`), else (a file, or a note not on this device) the same bytes (`duplicate` in lib/changes.js; a blob GitHub already has isn't uploaded again on push); a symlink can't be duplicated. Every ⋯ of a file or folder (and a board card's) has Copy link: a markdown link to it from the repo's root (`[Name](/path/to/Name.md)`, `repoLink`) to paste in another note; it follows renames like any link. `SearchSheet` finds visible files by path; with no query it lists recently opened ones.

## Symlinks
- Git mode `120000`. A link never opens itself: opening one (from the list, search or a note's link) opens its source. A link row is dimmed with "(symlink)" after its name (tooltip "Symlinked from <path>"). Links outside the repo, to nothing, or not on the device yet show the reason and can't be opened. Folder links sort with the folders.
- A file or folder that links point to shows them in its title bar after the title (`SymlinkedBy`): a grey ↘ badge that shows the link's name and opens it, or (↘ and a count) lists their paths.

## Links
- `useLinkIndex` indexes every note (local edit, else the offline copy) on the device; nothing is stored in the repo. Notes show `Backlinks` under the preview.
- Sync and Push first check the whole repo for broken links; if any, `SyncCheckModal` lists them (`BrokenLinkList`, shared with the Broken links page) with Fix, Open Broken links and Sync anyway.
- Rename and Move rewrite every affected link in the same local changes; the sheets say how many notes are affected (`LinksContext`).

## Uploads
Drop files on the file list (into the open folder or onto a folder row) or + → Upload files…. `handleUpload` stores each file's bytes in the offline cache under its git sha and records an upload in the local changes; Sync uploads the blobs in the one commit. A taken name asks Replace / Keep both / Skip (`UploadClashModal`); invalid or over-25 MB files are listed in `UploadErrorsModal`. Unused bytes are dropped from the cache.

## Offline and sync
- A service worker (vite-plugin-pwa) caches the app, and all notes are prefetched to IndexedDB.
- Every change is local until Sync, which makes one commit. GitHub's state after it is computed locally (`filesAfter`, `blobSha`), so a dropped connection can't leave pushed changes looking unsynced.
- The app never downloads GitHub's changes by itself: on start, return, coming online and pull-to-refresh it only checks for new commits (`checkRemote`) and shows the dot. Files change only on Sync or Pull (a repo never opened on this device downloads on start).
- **`SyncButton`** is one button everywhere (a plain `ghost` item in the rail; on the phone bar an icon button) that opens the sync menu: Sync all (blue badge: the total to push and pull; "7+" or New when GitHub can't count), then Push / Pull (badges; "New" when GitHub can't compare) / Discard (confirmed). The rail item's badge shows only directions (↑ ↓); icon-only ones a dot. It flashes only Failed and Offline.
- Success shows a toast (Synced / Pulled; `useRepo` reports it through `onDone`). A failed Sync / Push / Pull (not offline) opens `SyncErrorModal` (`describeSyncError`: what happened, what to do, GitHub's raw answer, the failed step, Try again).
- `lib/updates.js` reloads for new versions on start and on return, never while typing.
