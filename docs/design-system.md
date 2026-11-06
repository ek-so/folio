# Design system

shadcn/ui (new-york) · Tailwind CSS v4 · Radix UI · Phosphor icons (`@phosphor-icons/react`, regular weight; ⋯ `DotsThree` is bold).

## Rules
- Add components with `npx shadcn@latest add <component>`. Build controls from `Button` and `Input`, not raw elements; don't override heights.
- Merge classes with `cn()` from `@/lib/utils`. It knows the spacing tokens (`control*`, `space*`), so a later `h-auto` replaces an earlier `h-control`. Add any new spacing token to its list.
- No custom CSS for what Tailwind covers. `src/App.css` only styles the generated markdown preview, with the same tokens.
- All controls share one radius, `rounded-sm` (8px).

## Spacing tokens (`src/index.css`)
`--space-lg` 24px, `--space` 16px, `--space-sm` 8px, `--space-xs` 4px. Classes: `p-space`, `gap-space-sm`, `px-space-xs`, `inset-x-space`…
- **24px:** the desktop rail's padding left and bottom.
- **16px (base):** gutters around the tree and content box, the content's padding on every side, gaps between them, the Surface's distance from the screen's edges.
- **8px:** inside a piece (title bar, list and tree padding, gaps between buttons); the phone drawer's distance from the edges.
- **4px:** a title's own side padding in title bars.

## Control sizes (tokens in `src/index.css`)
- **Base 40px** (`h-control`, `size-control`, `min-h-control`): every tappable or input element: `Button` default and `size="icon"`, `Input`, menu items, list rows, sheet and dialog close.
- **Medium 32px** (`-md`): the tree's chevrons, the ⋯ inside list rows (a 24px line with an invisible 40px tap area).
- **Small 24px** (`-sm`, `Button size="sm"`): secondary controls beside a title, such as the symlink button.
- Exceptions: segmented toggles (`ui/segmented.jsx`: a base-height track, `p-1`), and two-line result rows (search, backlinks), which grow from the base minimum.

## Colors
Never hardcode colors; use the semantic tokens (light and dark values in `src/index.css`).

| Token | Role |
|---|---|
| `bg-background` | Page background |
| `bg-card` / `bg-popover` | Surface, sheets, popovers |
| `bg-secondary` | Hover, subtle fills |
| `border-border` | Dividers, input borders |
| `text-foreground` / `text-muted-foreground` | Primary / secondary text |
| `bg-primary` / `text-primary` | Accent blue |
| `bg-destructive` | Errors, danger |
| `bg-success` / `text-success-foreground` | Success (green) |
| `bg-segment` / `bg-segment-active` | Segmented toggle track / selected segment |
| `text-folder`, `text-file-image` | Folder and image file icons |
| `--tag-0`…`--tag-9`, `--tag-tint` | Property badge colors, tinted against `--card` |
| `--callout-*` | GitHub alert callouts in the preview |
| `--radius` | `0.75rem` base radius |
| `shadow-sm`…`shadow-lg` | Redefined in `src/index.css` (`@theme`): close under the element, a small drop and mostly spread |
| `border-lift-edge` | Outline of a box lifted by a shadow (hovered or dragged card): none on light, faint on dark |

`--safe-top` / `--safe-bottom` hold the iOS safe-area insets.

## Buttons
- Variants: `default`, `secondary`, `ghost`, `ghost-outline`, `outline`, `link`, and the colored ones: `destructive`, `ghost-destructive` (trash), `success`, `success-light`, `destructive-light`.
- Confirm and dismiss icon buttons: `success` / `destructive` alone, `success-light` / `destructive-light` side by side.

## Icons
- Icons are 16px (`size-4`); `Button` and menu items size them, so don't pass size classes.
- **File icons** (`FileIcon`, 20px): folder yellowish (`text-folder`), note and other files blue (`text-primary`), PDF red (`text-destructive`), image green (`text-file-image`). A symlink shows its target's icon with a small ↗ in the corner.

## List rows and cards
- **`ListRow`** (`ui/list-row.jsx`) is every list's row: file manager, tree, search, move, backlinks, popover lists. Icon left, title (with the changed dot), optional muted description, `trailing` slot (⋯), `leading` before the button (tree indent and chevron). Base height, rounded, highlighted on hover or while its ⋯ is open. States: `active`, `dimmed` (hidden files, symlinks), `disabled`. Lists don't build their own rows.
- **`CardTile`** (`ui/card-tile.jsx`, same props): file manager's cards. A 24px icon in a 48px tinted square over the name; outlined, `rounded-lg`; names up to two lines (tiles two lines tall only when some name in the folder wraps, measured in `FileBrowser`); ⋯ in the corner on hover.
- **`Tray`** / **`TrayTitle`** (`ui/tray.jsx`): a tinted, rounded box grouping what's in it under a small title (`grip`: the drag dots): a board's column. What sits in it is `bg-card`.
- **`Placeholder`** (`ui/placeholder.jsx`): light text for what isn't filled in yet (Untitled, No value).

## Tooltips
shadcn's (`ui/tooltip.jsx`): dark on light, text-sm, after 300ms (`TooltipProvider` in App), on mouse hover and keyboard focus, never on a tap. The `tooltip` prop of `Button` (`tooltipSide`), `ListRow` and `CardTile` (on the whole row, so a row that can't be opened explains why), or wrap in `Tip`. The one exception is the rendered note preview (HTML, not React): a date chip keeps its `title`.

## Overlays
- **`ConfirmModal`:** one confirmation for every destructive action (title, description, Cancel, a red confirm button, an optional milder `alternative`). `DeleteModal` is its wording for files, folders and views.
- **`BottomSheet`:** every prompt: a sheet on mobile, a centered Dialog from 768px. It clears a stale page lock on close. On iOS `lib/viewport.js` scrolls the page back after the keyboard closes.
- **Dropdown menus are non-modal** (`ui/dropdown-menu`): a modal menu that opens a dialog can leave the page locked and freeze every button. An item lights up only under a mouse or with the keyboard, never left lit by a tap.
- **Sub popovers:** `Popover` (`ui/popover.jsx`) or a nested `DropdownMenu`, opened on the side of the item. Content inside a popover that opens a modal wraps it in a `contents` div with the `own` handlers so clicks stay its own.
- Loading uses `Spinner`. `PullToRefresh` wraps every screen; `data-no-pull` areas opt out.
- Toasts: `ui/sonner`, bottom center, filled emerald, 20px icon and text, 16px padding; full width on phones.
