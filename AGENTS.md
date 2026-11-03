# Folio — Agent Instructions

## How to work with me
- **Ask before building.** Clarify scope before writing code. You may suggest, but never implement more than what was explicitly confirmed.
- **Be concise.** Short sentences. No filler. No summaries of what you just did.
- **Push to `main` directly.** No pull requests.

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

React + Vite PWA. Reads/writes markdown files from any GitHub repo via the GitHub REST API.

## Design system — shadcn/ui + Tailwind v4

**Stack:** shadcn/ui (new-york style) · Tailwind CSS v4 · Radix UI primitives · Phosphor icons (`@phosphor-icons/react`, regular weight — except ⋯ `DotsThree`, bold for visibility)

### Rules
- Use shadcn components from `src/components/ui/` for all interactive elements. Add new ones with `npx shadcn@latest add <component>`.
- Use Tailwind utility classes for layout and spacing. Never write custom CSS for things Tailwind covers.
- Use `cn()` from `@/lib/utils` to merge classes conditionally.
- **One control size.** Every tappable or input element is 40px tall: `Button` (default), `size="icon"` (40×40), `Input`, menu items, list rows, sheet and dialog close. Breadcrumb links sit on 24px lines with an invisible 40px tap area. Segmented toggles (`ui/segmented.jsx`): a 40px track (`rounded-lg`, `p-1`) with 32px segments (`rounded-sm`) inside. Build controls from `Button`/`Input` instead of raw elements; don't override heights or add size variants. The only 32px tappable things are those exceptions: segments, the list-row ⋯ and the 24px breadcrumb lines (audited in code: every other control gets 40px from `Button`, `Input`, menu items, rows and the dialog/sheet close). Exceptions: two-line result rows (search) grow from a 40px minimum; the ⋯ inside file-list rows is 32px, inside the row's 40px highlight (hovering it highlights the whole row).
- **Icons are 16px** (`size-4`). `Button` and menu items size icons by default — don't pass size classes.
- **File icons** come from `FileIcon` (20px Phosphor): folder blue (`text-primary`), note and other files grey, PDF red (`text-destructive`), image green (`text-file-image`). A symlink shows the icon of what it points to with a small ↗ in the corner (`link`).
- **Every screen uses `Header`**, with the same padding everywhere. File screens show ☰ (`AccountMenu`) at the repo root and on wider screens (≥640px, where the breadcrumbs aren't collapsed); on phones below the root ← instead (one level up: a file to its folder, a folder to its parent). Then, a little further apart, `PathBreadcrumbs`: the repo name in bold is always the first level (alone at home), then the folders. On mobile, anywhere below the repo (1+ levels), the crumbs collapse into one dropdown (current ▾) listing every level as an indented tree, repo first in bold, the current one checked. Search, then Sync (`SyncButton`), sit on the right. App pages (Settings, Broken links) show ← title. All ← buttons are outlined like ☰.
- **`Surface`** holds the open folder's or file's content: a `bg-card` box (white in light mode, slightly lighter grey than the page in dark) under `Header` down to the bottom of the screen, scrolling inside. On phones it's a sheet: edge to edge, top corners rounded, no side or bottom border; from 640px it's an outlined, fully rounded box lined up with the header's buttons (max 1000px of content). On top it has `TitleBar`: the file or folder icon in an outlined tile and an editable title, then the item's actions on the right: ⋯ (`ItemMenu`), then + (folders), ✏️ Edit (a note in preview) or ✓ (while editing); all its padding is 8px; a bottom border separates it from the content. There is no bottom bar. The title is the item's name (a note's without `.md`), and editing it renames (the repo root's isn't editable). A note's `# heading` stays in its markdown and shows in the preview and the editor like any other line. `Header` has no bottom border; it sits on the page background.
- Tooltips are the browser's own (`title`): no custom tooltip code. They show on hover only (not on phones), so nothing essential may depend on them.
- Never hardcode colors — use Tailwind semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, etc.).

### CSS variables (defined in `src/index.css`, with light and dark values)

| Tailwind token | Role |
|---|---|
| `bg-background` | Page background |
| `bg-card` / `bg-popover` | Sheets, popovers |
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

- `src/lib/github.js` — all GitHub API calls. `init(token)` sets up Octokit; `setRepo(owner, repo)` sets target repo. Blob reads go through the offline cache.
- `src/lib/changes.js` — pure model of local changes (edits, uploads, renames, deletes, new files) layered over the remote tree. Covered by `changes.test.js` (`npm test`).
- `src/lib/markdown.js` — preview rendering (blocks tagged with their source range; a `<details>` accordion is one block, so its markdown renders inside it as on GitHub), tap-to-source mapping (`tapOffset`), task checkbox positions (`taskOffsets`), markdown highlighting for the editor, image paths.
- `src/lib/links.js` — internal links (regular markdown only, no wiki links): extracting them (code ignored), the backlink / broken-link index, rewriting them when files move (same style: relative, `.md` or not, encoding, anchors; link text equal to the old name follows), Fix suggestions for broken links, and where symlinks point (`resolveSymlink`). Tested in `links.test.js`.
- `src/lib/files.js` — file-type and name helpers (`fileKind`, `imageMime`, `isImage`, `displayName`).
- `src/lib/cache.js` — IndexedDB copies of the last tree and of blobs (by sha) for offline use.
- `src/lib/storage.js` — localStorage/sessionStorage: token, repo, cached user, theme, local changes, open folder/note/page, recent files.
- `src/hooks/` — `useAuth` (token/user/repo), `useRepo` (remote tree, local changes, sync), `useNote` (one note's text, edit tracking), `useLinkIndex` (link index), `useRepoImages`, `useTheme`. `App.jsx` is layout and UI actions.
- Notes: `Editor` switches between `MarkdownPreview` (read-only apart from task checkboxes and accordions: Phosphor `CaretRight` (rendered into each `<summary>` with a portal) turns ▾ when open, and open ones stay open across re-renders) and `MarkdownEditor` (highlighted textarea). ✏️ opens the editor at the first block on screen (`visibleOffset`); a double tap or double click on text opens it at that word (counted from two clicks, since iPhones send no dblclick). Scrolling while editing stays in markdown; closing the keyboard (iOS Done, tapping elsewhere, Escape) or ✓ returns to preview.
- Symlinks (git mode `120000`; `useSymlinks` reads each link's target through the offline cache) never open themselves. Every link row is dimmed with "(symlink)" after its name; hovering it shows the browser tooltip "Symlinked from <source path>" (desktop only); opening a link — from the list, search or a note's link (`setSelectedFile` in App) — opens its source file or folder. Links outside the repo, to nothing, or not on the device yet show the reason instead and can't be opened. Folder links sort with the folders. A file or folder that links point to shows them in its title bar right after the title (`SymlinkedBy`, the `badge` of `TitleBar`): a ↗ button styled like ⋯ that opens the one link, or (↗ and a count) a list of their paths; choosing one goes to the folder holding that link.
- Images and PDFs open read-only in `FileViewer` (content via `useBlob`); PDFs show every page with pdf.js (`PdfView`, loaded on first use); only pages near the screen are drawn, to stay within iOS memory limits. `Editor` and `FileViewer` share `FilePage` (header, title bar).
- `AccountMenu` (☰, at the repo root and on wider screens) opens a popover with Broken links (count), Settings and Sign out. `Settings` (theme light/dark/system, account, repo) and `BrokenLinks` are app pages (`page` in App, remembered across reloads).
- Links: `useLinkIndex` reads every note (local edit, else the offline copy) and indexes links on the device — nothing is stored in the repo. Notes show `Backlinks` ("Linked from") under the preview. Sync (and Push) first checks for broken links anywhere in the repo: if any, `SyncCheckModal` lists them (`BrokenLinkList`, shared with the Broken links page) with Fix, Open Broken links and Sync anyway; fixing the last one syncs. Rename and Move rewrite every affected link in the same local changes (one commit on Sync); the sheets say how many notes are affected (`LinksContext`).
- Adding files from the device: drop them on the file list (into the open folder, or onto a folder row), or + → Upload files… (file picker, works on iPhone). `handleUpload` in App stores each file's bytes in the offline cache under its git sha (`blobShaOf`), then records an upload in the local changes; Sync uploads the blobs (`uploadBlob`) and commits them with everything else. A taken name asks Replace / Keep both (numbered name, `freePath`) / Skip (`UploadClashModal`); invalid or over-25 MB files (the whole file is held in memory) are listed in `UploadErrorsModal`. Bytes no change uses any more are deleted from the cache (`dropUnusedUploads` in `useRepo`).
- Rename/Move/Delete for any file or folder go through `ItemMenu` (⋯), on list rows and in the title bar of the open folder or file. `SearchSheet` finds any visible file by path; with no query it lists recently opened files.
- A failed Sync / Push / Pull (not offline) opens `SyncErrorModal`: plain explanation from `lib/syncErrors.js` (`describeSyncError`), what to do, GitHub's raw answer and the step it failed at (tagged in `lib/github.js`), plus Try again.
- Dropdown menus are non-modal (`ui/dropdown-menu` default): a modal menu locks the page, and when it opens a dialog that lock can stick and freeze every button. `BottomSheet` also clears a stale lock when it closes. On iOS, `lib/viewport.js` scrolls the page back after the keyboard closes.
- Prompts use `BottomSheet`: a bottom sheet on mobile, a centered dialog (shadcn Dialog) on desktop (≥768px). Loading uses `Spinner`. Pull-to-refresh wraps every screen (`PullToRefresh`); areas marked `data-no-pull` opt out.
- Offline: a service worker (vite-plugin-pwa) caches the app; all notes are prefetched to IndexedDB. `src/lib/updates.js` checks for new versions on start and on return to the app, and reloads when ready (never while typing). Every change is local until Sync, which makes one commit; GitHub's state after it is computed locally (`filesAfter`, `blobSha`), so a dropped connection right after the commit can't leave pushed changes looking unsynced. `SyncButton` is a split button, faded like Search (`ghost-outline`): Sync, plus ▾ with Push (blue count badge) / Pull (blue badge: files changed on GitHub since the last pull, from `changedFileCount`; "New" when GitHub can't compare) / Discard (Discard confirms via `DiscardModal`); an accent badge on Sync shows only the directions (↑ push, ↓ pull, or both), no counts. The app never downloads GitHub's changes by itself: on start, return, coming online and pull-to-refresh (which reloads the app) it only checks for new commits (`checkRemote`) and shows the dot; files change only on Sync or Pull. Only a repo never opened on this device is downloaded on start.
- The address bar mirrors the open folder/note (`/folio/<path>`); each folder or file opened is a history entry, and Back / Forward (`popstate` in App) move between them (Settings and Broken links aren't in the URL). The deploy copies `index.html` to `404.html` so those URLs load the app on GitHub Pages.
- App flow: **Auth → RepoSetup → FileBrowser / Editor / FileViewer**
- Token and repo are always user-supplied at runtime. Nothing is hardcoded.
