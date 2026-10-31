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

## Code reviews
Suggest a full code review from time to time: after a larger feature, or after roughly 10 changes since the last review. Review against the principles above, list findings by priority, and fix only what's confirmed.

React + Vite PWA. Reads/writes markdown files from any GitHub repo via the GitHub REST API.

## Design system — shadcn/ui + Tailwind v4

**Stack:** shadcn/ui (new-york style) · Tailwind CSS v4 · Radix UI primitives · Phosphor icons (`@phosphor-icons/react`, regular weight — except ⋯ `DotsThree`, bold for visibility; emoji for file/folder icons)

### Rules
- Use shadcn components from `src/components/ui/` for all interactive elements. Add new ones with `npx shadcn@latest add <component>`.
- Use Tailwind utility classes for layout and spacing. Never write custom CSS for things Tailwind covers.
- Use `cn()` from `@/lib/utils` to merge classes conditionally.
- **One control size.** Every tappable or input element is 40px tall: `Button` (default), `size="icon"` (40×40), `Input`, menu items, list rows, sheet close. Breadcrumb links sit on 24px lines with an invisible 40px tap area. Segmented toggles: a 40px track (`rounded-lg`, `p-1`) with 32px segments (`rounded-sm`) inside. Build controls from `Button`/`Input` instead of raw elements; don't override heights or add size variants.
- **Icons are 16px** (`size-4`). `Button` and menu items size icons by default — don't pass size classes.
- **Every screen uses `Header`.** Inner screens (folders, notes) show `← title`, with `PathBreadcrumbs` at the top of the scrolling content (not fixed); no separate home button. On mobile, 2+ levels below home collapse into one dropdown (current ▾, current checked).
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
| `--radius` | `0.75rem` base radius |

`--safe-top` / `--safe-bottom` hold the iOS safe-area insets. `src/App.css` only styles the generated markdown preview HTML, using the tokens above.

## Architecture

- `src/lib/github.js` — all GitHub API calls. `init(token)` sets up Octokit; `setRepo(owner, repo)` sets target repo. Blob reads go through the offline cache.
- `src/lib/changes.js` — pure model of local changes (edits, renames, deletes, new files) layered over the remote tree. Covered by `changes.test.js` (`npm test`).
- `src/lib/markdown.js` — preview rendering (blocks tagged with their source range), tap-to-source mapping, markdown highlighting for the editor, image paths.
- `src/lib/files.js` — file-type and name helpers (`imageMime`, `isImage`, `displayName`).
- `src/lib/cache.js` — IndexedDB copies of the last tree and of blobs (by sha) for offline use.
- `src/lib/storage.js` — localStorage/sessionStorage: token, repo, cached user, theme, local changes, open folder/note.
- `src/hooks/` — `useAuth` (token/user/repo), `useRepo` (remote tree, local changes, sync), `useNote` (one note's text, edit tracking), `useRepoImages`, `useTheme`. `App.jsx` is layout and UI actions.
- Notes: `Editor` switches between `MarkdownPreview` (tap to edit) and `MarkdownEditor` (highlighted textarea).
- Home header: `AccountMenu` (☰ owner / repo) opens a popover with theme (light/dark/system) and Settings / Sign out. `Settings` is its own page.
- Rename/Delete for any file or folder go through `ItemMenu` (⋯), on list rows and in the header of the open folder or note.
- Prompts use `BottomSheet` (shadcn Sheet); loading uses `Spinner`. Pull-to-refresh wraps every screen (`PullToRefresh`); areas marked `data-no-pull` opt out.
- Offline: a service worker (vite-plugin-pwa) caches the app; all notes are prefetched to IndexedDB. `src/lib/updates.js` checks for new versions on start and on return to the app, and reloads when ready (never while typing). Every change is local until Sync, which makes one commit.
- App flow: **Auth → RepoSetup → FileBrowser / Editor**
- Token and repo are always user-supplied at runtime. Nothing is hardcoded.
