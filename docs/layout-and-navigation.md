# Layout and navigation

## Structure
- **No header.** `AppNav` is the primary navigation.
- **`Surface`** holds the open folder's or file's content: a `bg-card` box next to the rail down to the bottom (on phones under the top bar), scrolling inside, with 16px gutters from 768px. The content (not the title bar) is a centered column of at most 1000px, a view's of at most 1500px (`wide`; files opened from it keep the 1000px limit).
- **`TitleBar`** starts every `Surface`: ← (see Trails and pages), then a file's or folder's icon and name as an outlined button (the buttons' own font, not bold) with ▾ on its right (`TitleMenuButton`; a note's name without `.md`) that opens the folder tree, or on a view the view's tree (see Folder tree); at File manager's root the repo's name, in the same button, opens `RepoMenu`. Pages show their title in bold from `lib/pages.js`, with no icon. Actions on the right: ⋯ (`ItemMenu`), then + (folders), ✏️ Edit or ✓ (notes). At least base height with 8px padding above and below and 16px at the sides, so every title bar is the same height; a bottom border separates it from the content. The title isn't editable: rename from ⋯. There is no bottom bar.

## Rail (from 768px, `NavRail`)
- Items in a group touch; every separator has 16px on both sides.
- Top: logo (`AppLogo`) and name, and a button that collapses the rail to icons only (collapsed: the button shows the logo, turning into its sidebar icon on hover or focus; labels become tooltips; remembered in `storage`). Expanded, its right edge is a drag handle (160–320px). The collapse button is plain `ghost`.
- Then: File manager, Search and Sync (`SyncButton`), a separator, the views and Views settings, a separator, Graph (the open page in accent), and at the bottom Broken links (count), Documentation, Settings and Sign out.
- A view's row shows ⋯ (`ViewMenu`: Rename / Remove) on hover; File manager and Graph have none.

## Phones (`TopBar`, above the `Surface`)
- 16px from the screen's sides. ☰, Search and Sync.
- ☰ (`AccountMenu`) opens a left `Sheet` that floats 8px from the screen's edges (as wide as the screen less 16px; 85% from 500px), titled Folio with its logo, ✕ at the right: list rows (`ListRow`) for File manager, the views and Views settings, Graph, then Broken links (count), Documentation, Settings and Sign out (red), separated by `Separator`s; the open page highlighted. Choosing one closes it. A view's ⋯ (`ViewMenu`: Rename / Remove) is always shown on touch.
- The bar slides away while the content scrolls down (at least 16px in one go) and returns on scrolling up (`useHideOnScroll`), leaving only the title bar fixed: its row folds in 300ms with a gentle ease while what's in it slides up and fades, so the page under it moves softly.

## Folder tree (`NavTree.jsx`)
- No tree panel. A file's or folder's name in its title bar is a button (`FolderTreeMenu`) that opens a popover with the tree of the folder you're in (the open folder, or the open file's).
- On a view's page it shows the view's own tree instead (`viewTree` in App): its widgets, then what each shows (a widget kind's `tree`: a Notes widget's notes, a board's shown columns and their cards, a planner's notes); the nodes holding the open note start expanded. A widget or column row only expands and collapses; a note opens in the view.
- The chevron only expands and collapses (open folders remembered for the session); choosing a folder or file opens it in the page you're on and closes the popover (a symlink opens its source). Each row has the same ⋯ (`ItemMenu`, `inList`) as file manager, shown only on hover with a mouse. The open item is highlighted.
- The repo menu (`RepoMenu`) is File manager's root title: the repos used on this device (the open one checked; another opens the app there, keeping the page and starting its trails and recent files afresh), Switch repository… (disabled while a sync runs), Open on GitHub.

## File manager
Items as a list (`ListRow`), cards (`CardTile`) or columns: the icon-only List | Cards | Columns switch is on top of the title bar's ⋯ menu, cards by default, one choice for every folder, remembered. The root has a menu with only the switch.
- **Columns** (from 768px; phones show cards, keeping the choice): always three columns split by `Separator`s, like a Mac's column view. The open folder is the last one, after its parents (`columnFolders` in `lib/columns.js`; near the root the columns after it stay empty). Each lists its folder as rows, folders first with a chevron; the row of the folder open in the next column is highlighted. A folder opens on a click, so the columns move along; a file opens as anywhere else.

## Trails and pages
- Each main page has its own trail (`trails` in App, rules in `lib/views.js`): the files and folders opened in that page, remembered across reloads. Empty is the page's start (Home's dashboard, Graph, File manager's root).
- Files and folders open in the page you're on (from the folder tree, lists, links, symlinks, ↘); Search always opens them in File manager. ← isn't the browser's Back (`upView` in `lib/views.js`): in File manager it goes a level up in the folders (a file to its folder, a folder to its parent); on a view or Graph it goes back to the page's start (the view itself). File manager's root, a page's start, Settings and Broken links have no ←; the browser's Back still walks the history. Choosing a view or Graph while on it returns to its start.
- An item that's gone (removed, discarded, removed by a Pull or Sync) drops out of every trail. From Settings, Broken links or Documentation, files open in File manager.
- Pages (`page` in App): a view's id (`home` or an added one) | `files` | `graph` | `settings` | `links`, remembered across reloads; a view that's gone falls back to the first page.

## Address bar (`lib/url.js`)
- File manager: `/folio/<path>` (trailing slash for folders). Home and Graph: `?page=home` / `?page=graph` (`&root` for the root folder). Settings, Broken links and Documentation leave the address as it is.
- The rail's main pages (views, File manager, Graph) are links to where each was left (`hrefOf`: `urlForPage` of its trail's current view): hovering shows the address, and a middle click, ⌘/Ctrl-click or the browser's menu opens or copies it; a plain click opens the page in place.
- Each page, folder or file opened is a history entry; renames, removes and discards replace it. Back / Forward (`popstate`) flush the open note, close any app page and show what the URL names (back along that page's trail if it's on it), or the nearest existing folder if it's gone.
- The app opens at the address it was loaded at if that names a page, folder or file. The deploy copies `index.html` to `404.html` so these URLs load on GitHub Pages.

## Documentation
- A fixed page (`PAGE.DOCS`, `components/Documentation.jsx`), under Broken links in the rail and in ☰: how views and each kind of widget work, in plain words. It lists every kind in `widgets/index.js` with its own label and icon, and its text per kind is `WIDGET_DOCS` in that file; a new widget kind needs a line there (until then it shows "No description yet"). When a widget changes, change its text there too.
