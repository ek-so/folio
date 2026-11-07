# Architecture

App flow: **Auth → RepoSetup → FileBrowser / Editor / FileViewer**. `App.jsx` is layout and UI actions.

## Code map
**`lib/` (pure logic, tested where noted)**
- `github.js` — every GitHub API call (`init(token)`, `setRepo`); blob reads go through the offline cache; failures are tagged with the step they happened at.
- `changes.js` — the model of local changes (edits, uploads, renames, deletes, new files) layered over the remote tree; `editNote` applies an edit to one note. Tested.
- `markdown.js` — preview rendering (blocks tagged with their source range, accordions, date spots), every date rewritten after editing, in the text and the properties (`withFixedDates`), where the preview shows dates (`dateSpans`) and one moved to another day (`withDay`, `valueDate`), tap-to-source, task checkboxes, editor highlighting, image paths.
- `previewLinks.js` — links in rendered markdown: `decorateLinks`, `inlineHtml`, `openLink`.
- `dates.js` — dates typed in a note's text: finding them in any clear format (`findDates`) and their one written form "17 Oct 2026, 14:30" (`formatDate`). Tested; `markdown.js`'s `withFixedDates` rewrites a note with it.
- `frontmatter.js` — a note's properties (read, add and remove keys, set, rename and remove values, colors of values, title, and `valueActions`: what a values dialog does over a set of notes, shared by the preview and the board). Tested.
- `tagColors.js` — picked value colors in `.folio/colors.json`. Tested.
- `archive.js` — done notes: `markedDone` (`status: done` and the day as `archived`), `ARCHIVE` (`.archive/` at the root) and `staleArchived` (archived more than 30 days ago: App removes them when Folio opens, as local changes). Tested.
- `links.js` — internal links: backlink and broken-link index, rewriting links on moves, Fix suggestions, `resolveSymlink`. Tested.
- `viewsConfig.js` — views and their widgets in `.folio/views.json`, `isConfigPath`. Tested.
- `views.js` — each main page's trail (`openView`, `currentView`, `trailTo`). Tested.
- `pages.js` — page ids and the title and icon of every page.
- `tree.js` (which folders the tree opens), `url.js` (address bar), `resize.js`, `files.js`, `cache.js` (IndexedDB), `storage.js` (localStorage), `syncErrors.js`, `updates.js`, `viewport.js`.

**`hooks/`**
- `useAuth`, `useRepo` (remote tree, local changes, sync), `useNote` (a note's text, saved as you type; `beginEdit` / `endEdit`), `useLinkIndex`, `useSymlinks`, `useBlob`, `useRepoImages`, `useTheme`, `useSingleOpen`, `useOverlayOpen` (a popover's or menu's open state; a scroll by touch closes it).
- `useConfig` — reads every `.folio/` file (`read(path)` → `{ ready, text }`, `readIn(ch, path)`); `write` and `erase` are changes (`ch => ch`) for `update`, so a config change can go in one step with others. Nothing can be changed until it's read, so an unreadable config is never overwritten; a failed fetch is retried on coming online or returning.
- `useTagColors` — `colors`, `canEdit`, `set(key, value, color)` as a change.

**`widgets/`** — one folder each, registered in `widgets/index.js`. A kind is one object: `type`, `label`, `icon`, `Widget`, `Setup`, `moved`, `removed`, optionally `title`, `fileMoves` and `valueScope` (for a note that's one of its cards: where its values come from, the properties that come back when missing (`required`), can't be edited in the markdown (`locked`) and show as the widget's own badge (`badges`), and the order they come in (`order`); App joins every widget's). A widget gets only `services` (App's `widgetServices`), so all its changes go through the app's pipeline; App and `ViewPage` never name a kind. See [views-and-boards](views-and-boards.md).
