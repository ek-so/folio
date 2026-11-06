# Layout and navigation

## Structure
- **No header.** `AppNav` is the primary navigation.
- **`Surface`** holds the open folder's or file's content: a `bg-card` box next to the rail down to the bottom (on phones under the top bar), scrolling inside, with 16px gutters from 768px. The content (not the title bar) is a centered column of at most 1000px, except Home's (`wide`: the full width; files opened from it keep the limit).
- **`TitleBar`** starts every `Surface`: ← (when there's a step back) and the item's name in bold (a note's without `.md`; the repo's at the root; pages show their title from `lib/pages.js`; no icons). Actions on the right: ⋯ (`ItemMenu`), then + (folders), ✏️ Edit or ✓ (notes). At least base height with 8px padding, so every title bar is the same height; a bottom border separates it from the content. The title isn't editable: rename from ⋯. There is no bottom bar.

## Rail (from 768px, `NavRail`)
- Items in a group touch; every separator has 16px on both sides.
- Top: logo (`AppLogo`) and name, and a button that collapses the rail to icons only (collapsed: the button shows the logo, turning into its sidebar icon on hover or focus; labels become tooltips; remembered in `storage`). Expanded, its right edge is a drag handle (160–320px). While the file tree is hidden, a tree button (`TreeView`) next to it shows the tree again. The collapse buttons are plain `ghost`.
- Then: Sync (`SyncButton`) and Search, a separator, the views and Add view, a separator, File manager and Graph (the open one in accent), and at the bottom Broken links (count), Settings and Sign out.
- A view's row shows ⋯ (`ViewMenu`: Rename / Remove) on hover; File manager and Graph have none.

## Phones (`TopBar`, above the `Surface`)
- ☰ (`AccountMenu`: the views and Add view, File manager and Graph, Broken links, Settings, Sign out; the open one checked), the file-tree button (`NavDrawerButton`, on the three main pages), Search and Sync.
- A view's ⋯ in ☰ is always shown and opens its Rename / Remove (`ViewMenu`) as a sub popover on its side.
- The bar slides away while the content scrolls down and returns on scrolling up (`useHideOnScroll`), leaving only the title bar fixed.

## File tree (`NavTree.jsx`)
- Every main page's `Surface` (`tree`) has the repo's folders and files in its own `bg-card` box to its left from 768px: 300px by default, a drag handle in the 16px gap (also ←/→ keys, saved when let go; double click resets), 200–480px, remembered in `storage` (`ResizeHandle`, `useResizableWidth`, limits in `lib/resize.js`; at most 35% of the window, the rail 25%).
- Titled with the repo's name as a menu (`RepoMenu`): the repos used on this device (the open one checked; another opens the app there, keeping the page and starting its trails and recent files afresh), Switch repository… (disabled while a sync runs), Open on GitHub. Collapse all sits at the right of the title; on desktop the rail's collapse icon hides the panel (`treeCollapsed`, remembered).
- Below 768px the tree opens in a left `Sheet` (✕ at the right of the title) that floats like a popover, 8px from the screen's edges.
- The chevron only expands and collapses; the name opens the folder in the page you're on and expands it; choosing a file opens it there (a symlink opens its source). Each row has the same ⋯ (`ItemMenu`, `inList`) as file manager, shown only on hover with a mouse. The open item is highlighted and revealed (`foldersToOpen`).
- Drag and drop (desktop panel only): a row dropped on a folder moves there (on a file: into its folder; on empty space: the root), a collapsed folder held under a drag opens after 0.6s, files from the device upload there. `canMoveTo` decides where an item may go (also used by `MoveModal`); moves go through `handleDropMove` in App, which shows a refusal as a toast.

## File manager
Items as a list (`ListRow`) or cards (`CardTile`): the icon-only List | Cards switch is on top of the title bar's ⋯ menu, cards by default, one choice for every folder, remembered. The root has a menu with only the switch.

## Trails and pages
- Each main page has its own trail (`trails` in App, rules in `lib/views.js`): the files and folders opened in that page, remembered across reloads. Empty is the page's start (Home's dashboard, Graph, File manager's root).
- Files and folders open in the page you're on (from the tree, lists, links, symlinks, ↘); ← goes back one step in that page only (the browser's Back when that's also its previous entry). Choosing a view or Graph while on it returns to its start. A file or folder shows ← only when it has a step back; a page's start, Settings and Broken links have none.
- An item that's gone (removed, discarded, removed by a Pull or Sync) drops out of every trail. From Settings or Broken links, files open in File manager.
- Pages (`page` in App): a view's id (`home` or an added one) | `files` | `graph` | `settings` | `links`, remembered across reloads; a view that's gone falls back to the first page.

## Address bar (`lib/url.js`)
- File manager: `/folio/<path>` (trailing slash for folders). Home and Graph: `?page=home` / `?page=graph` (`&root` for the root folder). Settings and Broken links leave the address as it is.
- Each page, folder or file opened is a history entry; renames, removes and discards replace it. Back / Forward (`popstate`) flush the open note, close any app page and show what the URL names (back along that page's trail if it's on it), or the nearest existing folder if it's gone.
- The app opens at the address it was loaded at if that names a page, folder or file. The deploy copies `index.html` to `404.html` so these URLs load on GitHub Pages.
