# Layout and navigation

## Structure
- **No header.** `AppNav` is the primary navigation.
- **`Surface`** holds the open folder's or file's content: a `bg-card` box next to the rail down to the bottom (on phones under the top bar), scrolling inside, with 16px gutters from 768px. The content (not the title bar) is a centered column of at most 1000px, a view's of at most 1500px (`wide`; files opened from it keep the 1000px limit).
- **`TitleBar`** starts every `Surface`: for a file or folder the ← | ▾ split button (`BackTreeButton`, see Folder tree), then the item's name in bold (a note's without `.md`; at File manager's root the repo's, as `RepoMenu`; pages show their title from `lib/pages.js`; no icons). Actions on the right: ⋯ (`ItemMenu`), then + (folders), ✏️ Edit or ✓ (notes). At least base height with 8px padding above and below and 16px at the sides, so every title bar is the same height; a bottom border separates it from the content. The title isn't editable: rename from ⋯. There is no bottom bar.

## Rail (from 768px, `NavRail`)
- Items in a group touch; every separator has 16px on both sides.
- Top: logo (`AppLogo`) and name, and a button that collapses the rail to icons only (collapsed: the button shows the logo, turning into its sidebar icon on hover or focus; labels become tooltips; remembered in `storage`). Expanded, its right edge is a drag handle (160–320px). The collapse button is plain `ghost`.
- Then: File manager, Search and Sync (`SyncButton`), a separator, the views and Add view, a separator, Graph (the open page in accent), and at the bottom Broken links (count), Documentation, Settings and Sign out.
- A view's row shows ⋯ (`ViewMenu`: Rename / Remove) on hover; File manager and Graph have none.

## Phones (`TopBar`, above the `Surface`)
- 16px from the screen's sides. ☰ (`AccountMenu`: File manager, the views and Add view, Graph, Broken links, Documentation, Settings, Sign out; the open one checked), Search and Sync.
- A view's ⋯ in ☰ is always shown and opens its Rename / Remove (`ViewMenu`) as a sub popover on its side.
- The bar slides away while the content scrolls down (at least 16px in one go) and returns on scrolling up (`useHideOnScroll`), leaving only the title bar fixed: its row folds in 300ms with a gentle ease while what's in it slides up and fades, so the page under it moves softly.

## Folder tree (`NavTree.jsx`)
- No tree panel. A file's or folder's title bar starts with a split button (`BackTreeButton`): ← goes back a step in the page (disabled without one); ▾ opens a popover with the tree of the folder you're in (the open folder, or the open file's).
- The chevron only expands and collapses (open folders remembered for the session); choosing a folder or file opens it in the page you're on and closes the popover (a symlink opens its source). Each row has the same ⋯ (`ItemMenu`, `inList`) as file manager, shown only on hover with a mouse. The open item is highlighted.
- The repo menu (`RepoMenu`) is File manager's root title: the repos used on this device (the open one checked; another opens the app there, keeping the page and starting its trails and recent files afresh), Switch repository… (disabled while a sync runs), Open on GitHub.

## File manager
Items as a list (`ListRow`), cards (`CardTile`) or columns: the icon-only List | Cards | Columns switch is on top of the title bar's ⋯ menu, cards by default, one choice for every folder, remembered. The root has a menu with only the switch.
- **Columns** (from 768px; phones show cards, keeping the choice): always three columns split by `Separator`s, like a Mac's column view. The open folder is the last one, after its parents (`columnFolders` in `lib/columns.js`; near the root the columns after it stay empty). Each lists its folder as rows, folders first with a chevron; the row of the folder open in the next column is highlighted. A folder opens on a click, so the columns move along; a file opens as anywhere else.

## Trails and pages
- Each main page has its own trail (`trails` in App, rules in `lib/views.js`): the files and folders opened in that page, remembered across reloads. Empty is the page's start (Home's dashboard, Graph, File manager's root).
- Files and folders open in the page you're on (from the folder tree, lists, links, symlinks, ↘); Search always opens them in File manager; ← goes back one step in that page only (the browser's Back when that's also its previous entry). Choosing a view or Graph while on it returns to its start. A file or folder shows ← only when it has a step back; a page's start, Settings and Broken links have none.
- An item that's gone (removed, discarded, removed by a Pull or Sync) drops out of every trail. From Settings, Broken links or Documentation, files open in File manager.
- Pages (`page` in App): a view's id (`home` or an added one) | `files` | `graph` | `settings` | `links`, remembered across reloads; a view that's gone falls back to the first page.

## Address bar (`lib/url.js`)
- File manager: `/folio/<path>` (trailing slash for folders). Home and Graph: `?page=home` / `?page=graph` (`&root` for the root folder). Settings, Broken links and Documentation leave the address as it is.
- The rail's main pages (views, File manager, Graph) are links to where each was left (`hrefOf`: `urlForPage` of its trail's current view): hovering shows the address, and a middle click, ⌘/Ctrl-click or the browser's menu opens or copies it; a plain click opens the page in place.
- Each page, folder or file opened is a history entry; renames, removes and discards replace it. Back / Forward (`popstate`) flush the open note, close any app page and show what the URL names (back along that page's trail if it's on it), or the nearest existing folder if it's gone.
- The app opens at the address it was loaded at if that names a page, folder or file. The deploy copies `index.html` to `404.html` so these URLs load on GitHub Pages.

## Documentation
- A fixed page (`PAGE.DOCS`, `components/Documentation.jsx`), under Broken links in the rail and in ☰: how views and each kind of widget work, in plain words. It lists every kind in `widgets/index.js` with its own label and icon, and its text per kind is `WIDGET_DOCS` in that file; a new widget kind needs a line there (until then it shows "No description yet"). When a widget changes, change its text there too.
