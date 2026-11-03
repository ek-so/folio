# Folio — Agent Instructions

React + Vite PWA. Reads/writes markdown files from any GitHub repo via the GitHub REST API.

## How to work with me
- **Ask before building.** Clarify scope before writing code. You may suggest, but never implement more than what was explicitly confirmed.
- **Be concise.** Short sentences. No filler. No summaries of what you just did.
- **Always work on `main` and push every commit to it.** No branches, no pull requests. If a push is refused, say so; don't leave commits unpushed.

## Principles
1. **One way to do each thing.** Before adding a component, pattern or helper, look for an existing one and reuse or extend it. Two solutions to one problem drift apart and double the bugs.
2. **One source of truth; derive the rest.** Store the minimum state and compute everything else from it. Never keep a copy that can get out of sync.
3. **Logic in pure functions, effects in hooks, rendering in components.** Rules about data live in plain, testable functions. Hooks own network, storage and timers. Components only display and forward user actions.
4. **One path for every write.** All changes go through the same pipeline. Side doors skip the rules everything else follows.
5. **Never lose the user's work.** Save before acting. After an operation, clear only what you know succeeded. Confirm before destroying. Don't allow editing what can't be saved.
6. **Assume the network can disappear at any moment.** Every remote call has an offline answer. Tell "offline", "rejected" and "broken" apart and handle each.
7. **Fail visibly, recover calmly.** Show a clear state for loading, empty, error and offline. Never swallow an error in a way that leaves the screen lying.
8. **Design system first.** Use the shared components and theme tokens. A one-off style or color is a future inconsistency.
9. **Small changes, verified before shipping.** Build, run tests, and check the change once in the real app. Test logic, not pixels; keep tests few and meaningful.
10. **Replace means remove.** When something new replaces something old, delete the old code in the same change.

## Keeping this file true
This file is only useful while it matches the code. Before relying on a rule or description here, check it against the code; whenever a change makes any line here wrong or incomplete, fix that line in the same commit. If the code and this file disagree and it's unclear which is intended, ask.

## Code reviews
Suggest a full code review from time to time: after a larger feature, or after roughly 10 changes since the last review. Review against the principles above, list findings by priority, and fix only what's confirmed.

## Design system — shadcn/ui + Tailwind v4

**Stack:** shadcn/ui (new-york style) · Tailwind CSS v4 · Radix UI primitives · Phosphor icons (`@phosphor-icons/react`, regular weight — except ⋯ `DotsThree`, bold for visibility)

### Rules
- Use shadcn components from `src/components/ui/` for all interactive elements. Add new ones with `npx shadcn@latest add <component>`.
- Use Tailwind utility classes for layout and spacing. Never write custom CSS for things Tailwind covers.
- Use `cn()` from `@/lib/utils` to merge classes conditionally.
- **Two control sizes, set as tokens** in `src/index.css`: base `--spacing-control` (40px) and small `--spacing-control-sm` (24px). Use `h-control`, `size-control`, `min-h-control` (and `-sm`); never hardcode a pixel height. Every tappable or input element is base: `Button` (default), `size="icon"`, `Input`, menu items, list rows, sheet and dialog close, the title bar's icon tile. Small (`Button size="sm"`) is for secondary controls beside the title, such as the symlink button (`SymlinkedBy`), and breadcrumb links (24px lines with an invisible 40px tap area). Build controls from `Button`/`Input` instead of raw elements; don't override heights. All controls share one radius, `rounded-sm` (8px). Exceptions: segmented toggles (`ui/segmented.jsx`: a base-height `rounded-sm` track, `p-1`, with `rounded` segments filling it); the ⋯ inside file-list rows (base minus 8px, inside the row's base-height highlight, which hovering it highlights); two-line result rows (search, backlinks), which grow from the base minimum.
- **Icons are 16px** (`size-4`). `Button` and menu items size icons by default — don't pass size classes.
- **File icons** come from `FileIcon` (20px Phosphor): folder blue (`text-primary`), note and other files grey, PDF red (`text-destructive`), image green (`text-file-image`). A symlink shows the icon of what it points to with a small ↗ in the corner (`link`).
- **Every screen uses `Header`**, with the same padding everywhere. File screens show ☰ (`AccountMenu`) at the repo root and on wider screens (≥640px, where the breadcrumbs aren't collapsed); on phones below the root ← instead (one level up: a file to its folder, a folder to its parent). Then, a little further apart, `PathBreadcrumbs`: the repo in bold is always the first level (alone at home, as `owner/repo`; below home just the repo name), then the folders. On mobile, anywhere below the repo (1+ levels), the crumbs collapse into one dropdown (current ▾) listing every level as an indented tree, repo first in bold, the current one checked. Search, then Sync (`SyncButton`), sit on the right. App pages (Settings, Broken links) show ← title; Settings' content sits in a `Surface` (without a `TitleBar`). All ← buttons are outlined like ☰.
- **`Surface`** holds the open folder's or file's content: a `bg-card` box (white in light mode, slightly lighter grey than the page in dark) under `Header` down to the bottom of the screen, scrolling inside. On phones it's a sheet: edge to edge, top corners rounded, outlined; from 640px it's a fully rounded box lined up with the header's buttons (max 1000px of content). On top it has `TitleBar`: the file or folder icon in a tile tinted with the icon's own color (`bg-current/15`, via `iconColor`) and an editable title, then the item's actions on the right: ⋯ (`ItemMenu`), then + (folders), ✏️ Edit (a note in preview) or ✓ (while editing); all its padding is 8px; a bottom border separates it from the content. There is no bottom bar. The title is the item's name (a note's without `.md`), and editing it renames (the repo root's isn't editable). A note's `# heading` stays in its markdown and shows in the preview and the editor like any other line. `Header` has no bottom border; it sits on the page background.
- Tooltips are the browser's own (`title`): no custom tooltip code. They show on hover only (not on phones), so nothing essential may depend on them.
- Never hardcode colors — use Tailwind semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, etc.).

### CSS variables (defined in `src/index.css`, with light and dark values)

| Tailwind token | Role |
|---|---|
| `bg-background` | Page background |
| `bg-card` / `bg-popover` | `Surface` (the file/folder box), sheets, popovers |
| `bg-secondary` | Hover, subtle fills |
| `border-border` | Dividers, input borders |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary / muted text |
| `bg-primary` / `text-primary` | Accent blue |
| `bg-destructive` | Errors / danger |
| `bg-success` / `text-success-foreground` | Success feedback, e.g. "Synced" (light green) |
| `bg-segment` / `bg-segment-active` | Segmented toggle track / selected segment (lighter in both themes) |
| `text-file-image` | Image file icons |
| `--callout-*` / `--callout-tint` | GitHub alert callouts in the preview (note, tip, important, warning, caution); tinted against the background |
| `--radius` | `0.75rem` base radius |

`--safe-top` / `--safe-bottom` hold the iOS safe-area insets. `src/App.css` only styles the generated markdown preview HTML, using the tokens above.

## Architecture

App flow: **Auth → RepoSetup → FileBrowser / Editor / FileViewer** (`App.jsx` is layout and UI actions). Token and repo are always user-supplied at runtime; nothing is hardcoded.

### Code map
- `lib/github.js` — all GitHub API calls (`init(token)`, `setRepo(owner, repo)`); blob reads go through the offline cache; failures are tagged with the step they happened at.
- `lib/changes.js` — pure model of local changes (edits, uploads, renames, deletes, new files) layered over the remote tree. Tested in `changes.test.js` (`npm test`).
- `lib/markdown.js` — preview rendering (blocks tagged with their source range; a `<details>` accordion is one block), tap-to-source (`tapOffset`), task checkboxes (`taskOffsets`), editor highlighting, image paths.
- `lib/links.js` — internal links (regular markdown only, no wiki links; code ignored): the backlink / broken-link index, rewriting links when files move (same style: relative, `.md` or not, encoding, anchors; link text equal to the old name follows), Fix suggestions, and `resolveSymlink`. Tested in `links.test.js`.
- `lib/files.js` (file-type and name helpers), `lib/cache.js` (IndexedDB copies of the last tree and of blobs by sha), `lib/storage.js` (localStorage/sessionStorage: token, repo, user, theme, local changes, open folder/note/page, recent files), `lib/syncErrors.js`, `lib/updates.js`, `lib/viewport.js`.
- `hooks/` — `useAuth`, `useRepo` (remote tree, local changes, sync), `useNote`, `useLinkIndex`, `useSymlinks`, `useBlob`, `useRepoImages`, `useTheme`.

### Behaviour
- **Notes:** `Editor` switches between `MarkdownPreview` (read-only apart from task checkboxes and accordions; open accordions stay open across re-renders) and `MarkdownEditor` (highlighted textarea). ✏️ opens the editor at the first block on screen (`visibleOffset`); a double tap or double click on text opens it at that word (counted from two clicks, since iPhones send no dblclick). Closing the keyboard (iOS Done, tapping elsewhere, Escape) or ✓ returns to preview.
- **Images and PDFs** open read-only in `FileViewer` (`useBlob`); PDFs use pdf.js (`PdfView`, loaded on first use) and draw only pages near the screen, for iOS memory. `Editor` and `FileViewer` share `FilePage`.
- **Symlinks** (git mode `120000`) never open themselves. A link row is dimmed with "(symlink)" after its name (desktop tooltip: "Symlinked from <path>"); opening a link — from the list, search or a note's link (`setSelectedFile` in App) — opens its source. Links outside the repo, to nothing, or not on the device yet show the reason and can't be opened. Folder links sort with the folders. A file or folder that links point to shows them in its title bar right after the title (`SymlinkedBy`, the `badge` of `TitleBar`): a ↗ button styled like ⋯ that opens the one link, or (↗ and a count) lists their paths; choosing one goes to the folder holding that link.
- **Links:** `useLinkIndex` indexes every note (local edit, else the offline copy) on the device; nothing is stored in the repo. Notes show `Backlinks` under the preview. Sync and Push first check the whole repo for broken links: if any, `SyncCheckModal` lists them (`BrokenLinkList`, shared with the Broken links page) with Fix, Open Broken links and Sync anyway. Rename and Move rewrite every affected link in the same local changes; the sheets say how many notes are affected (`LinksContext`).
- **Uploads:** drop files on the file list (into the open folder or onto a folder row) or + → Upload files…. `handleUpload` in App stores each file's bytes in the offline cache under its git sha (`blobShaOf`) and records an upload in the local changes; Sync uploads the blobs (`uploadBlob`) in the one commit. A taken name asks Replace / Keep both (`freePath`) / Skip (`UploadClashModal`); invalid or over-25 MB files are listed in `UploadErrorsModal`. Unused bytes are dropped from the cache (`dropUnusedUploads`).
- **Item actions:** Rename / Move / Delete for any file or folder go through `ItemMenu` (⋯), on list rows and in the title bar. `SearchSheet` finds visible files by path; with no query it lists recently opened ones.
- **Offline and sync:** a service worker (vite-plugin-pwa) caches the app and all notes are prefetched to IndexedDB. Every change is local until Sync, which makes one commit; GitHub's state after it is computed locally (`filesAfter`, `blobSha`), so a dropped connection can't leave pushed changes looking unsynced. The app never downloads GitHub's changes by itself: on start, return, coming online and pull-to-refresh it only checks for new commits (`checkRemote`) and shows the dot; files change only on Sync or Pull (a repo never opened on this device downloads on start). `SyncButton` is a split button (`ghost-outline`): Sync, plus ▾ with Push (blue count badge) / Pull (blue badge from `changedFileCount`; "New" when GitHub can't compare) / Discard (confirms via `DiscardModal`); the badge on Sync shows only directions (↑ ↓). A failed Sync / Push / Pull (not offline) opens `SyncErrorModal` (`describeSyncError`: plain explanation, what to do, GitHub's raw answer, the failed step, Try again). `lib/updates.js` reloads for new versions on start and on return, never while typing.
- **Navigation:** the address bar mirrors the open folder/note (`/folio/<path>`); each one opened is a history entry and Back / Forward (`popstate` in App) move between them (Settings and Broken links aren't in the URL). The deploy copies `index.html` to `404.html` so those URLs load on GitHub Pages. `AccountMenu` (☰) opens Broken links (count), Settings and Sign out; `Settings` and `BrokenLinks` are app pages (`page` in App, remembered across reloads).
- **Overlays:** prompts use `BottomSheet` (a sheet on mobile, a centered shadcn Dialog from 768px). Dropdown menus are non-modal (`ui/dropdown-menu` default): a modal menu that opens a dialog can leave the page locked and freeze every button; `BottomSheet` also clears a stale lock on close, and on iOS `lib/viewport.js` scrolls the page back after the keyboard closes. Loading uses `Spinner`. `PullToRefresh` wraps every screen; `data-no-pull` areas opt out.
