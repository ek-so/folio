# Architecture

App flow: **Auth → RepoSetup → FileBrowser / Editor / FileViewer**. `App.jsx` is layout and UI actions.

## Code map
**`lib/` (pure logic, tested where noted)**
- `github.js` — every GitHub API call (`init(token)`, `setRepo`); blob reads go through the offline cache; failures are tagged with the step they happened at.
- `changes.js` — the model of local changes (edits, uploads, renames, deletes, new files) layered over the remote tree; `editNote` applies an edit to one note. Tested.
- `markdown.js` — preview rendering (blocks tagged with their source range, accordions, date spots), every date rewritten after editing, in the text and the properties (`withFixedDates`), where the preview shows dates (`dateSpans`) and one moved to another day (`withDay`, `valueDate`), tap-to-source, task checkboxes, editor highlighting, image paths.
- `previewLinks.js` — links in rendered markdown: `decorateLinks`, `inlineHtml`, `openLink`.
- `dates.js` — dates typed in a note's text: finding them in any clear format (`findDates`) and their one written form "17 Oct 2026, 14:30" (`formatDate`), and how a badge shows one: without the year when it's this year (`dateLabel`). Tested; `markdown.js`'s `withFixedDates` rewrites a note with it.
- `frontmatter.js` — a note's properties (read, add and remove keys, set, rename and remove values, colors of values, title, and `valueActions`: what a values dialog does over a set of notes, shared by the preview and the board). Tested.
- `tagColors.js` — picked value colors in `.folio/colors.json`. Tested.
- `locks.js` — files locked against editing, `.folio/locks.json` (`toggledLock`, `movedLocks`, `removedLocks`). Tested.
- `icons.js` — the emoji that replaces a file's or folder's icon, `.folio/icons.json` (`iconOf`, `withIcon`, `movedIcons`, `removedIcons`), and `leadingEmoji` / `withoutEmoji` for names that start with one. Tested.
- `search.js` — notes found by what they say, with a snippet (`searchNotes`). Tested.
- `assets.js` — what the Assets page lists and when each file was added, `.folio/assets.json` (`assetList`, `withAdded`). `pathMap.js` — settings keyed by path that follow moves and deletes (icons, assets). Tested.
- `archive.js` — the archive: what's removed moves into `.archive/<day>/` (`archiveDay`, `inArchive`), `markedDone` (a planner card's `status: done`) and `staleArchiveDays` (day folders older than 30 days: App removes them when Folio opens, as local changes). Tested.
- `links.js` — internal links: backlink and broken-link index, rewriting links on moves, Fix suggestions, `resolveSymlink`. Tested.
- `viewsConfig.js` — views and their widgets in `.folio/views.json`, `isConfigPath`. Tested.
- `views.js` — each main page's trail (`openView`, `currentView`, `trailTo`). Tested.
- `pages.js` — page ids and the title and icon of every page.
- `columns.js` (File manager's Columns), `url.js` (address bar), `resize.js`, `files.js`, `cache.js` (IndexedDB), `storage.js` (localStorage), `syncErrors.js`, `updates.js`, `viewport.js`, `plural.js` ("3 notes").

**`hooks/`**
- `useAuth`, `useRepo` (remote tree, local changes, sync), `useNote` (a note's text, saved as you type; `beginEdit` / `endEdit`), `useLinkIndex`, `useSymlinks`, `useBlob`, `useRepoImages`, `useTheme`, `useIsDesktop`, `useSingleOpen`, `useOverlayOpen` (a popover's or menu's open state; a scroll by touch closes it).
- `useConfig` — reads every `.folio/` file (`read(path)` → `{ ready, text }`, `readIn(ch, path)`); `write` and `erase` are changes (`ch => ch`) for `update`, so a config change can go in one step with others. Nothing can be changed until it's read, so an unreadable config is never overwritten; a failed fetch is retried on coming online or returning.
- `useTagColors` — `colors`, `canEdit`, `set(key, value, color)` as a change.
- `useLocks` — `isLocked(path)`, `canEdit`, and `toggle`, `moved`, `removed` as changes.
- `useIcons` — `iconOf(path)`, `canEdit`, and `set`, `moved`, `removed` as changes; `IconsContext` (App) gives every `FileIcon` and `ItemMenu` the icons and `onSet`.
- `useConfigFile` — one `.folio` settings file read and written through parse and serialize (never saved over when unreadable): `useLocks`, `useIcons`, `useAssets` are built on it.
- `useAssets` — `added`, and `record`, `moved`, `removed` as changes.
- `useDragSensors` — how every drag starts (mouse after 5px, touch after holding 0.25s): board, planner, a note's lists, Edit list.
- `useFolderNotes` — what a board or planner does with its folder's notes (values, properties: `showProperties`, `renameProperty`, `removeProperty`; a card's title, description, removal).

**`widgets/`** — one folder each, registered in `widgets/index.js`. A kind is one object: `type`, `label`, `icon`, `Widget`, `Setup`, `moved`, `removed`, optionally `title`, `fileMoves` and `valueScope` (for a note that's one of its cards: where its values come from, the properties that come back when missing (`required`), can't be edited in the markdown (`locked`) and show as the widget's own badge (`badges`), and the order they come in (`order`); App joins every widget's). A widget gets only `services` (App's `widgetServices`), so all its changes go through the app's pipeline; App and `ViewPage` never name a kind. See [views-and-boards](views-and-boards.md).
