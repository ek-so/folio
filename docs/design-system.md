# Design system

shadcn/ui (new-york) · Tailwind CSS v4 · Radix UI · Phosphor icons (`@phosphor-icons/react`, regular weight; ⋯ `DotsThree` is bold).

## Components (`src/components/ui/`)
- **shadcn/ui (Radix):** `button`, `dialog`, `sheet`, `dropdown-menu`, `popover`, `tooltip`, `sonner`, `input`, `label`, `separator`, `toggle-group`, `calendar`. Use them for dividers (`Separator`), field labels (`Label`) and one-of-several choices (`ToggleGroup`: color swatches, `Segmented`).
- **Custom, because shadcn has no equivalent:** `ListRow`, `CardTile`, `Tray`, `Badge` (a label that can be a button), `Checkbox` and `Radio` (only the mark inside a clickable row), `SignInSteps` (the sign-in's stepper), `SearchInput` (`ui/search-input.jsx`: every search field, with an accent ✕ that clears it while it has text), `Placeholder`, `Spinner` (pull-to-refresh draws it still), `ResizeHandle` (pixel widths with limits), `MarkdownEditor`'s textarea (highlight overlay).
- Before adding a custom piece, check the list above and the shadcn registry. If the CLI can't reach the registry, copy the component's source into `ui/` and adapt it to our tokens.

## Rules
- Add components with `npx shadcn@latest add <component>`. Build controls from `Button` and `Input`, not raw elements; don't override heights.
- Merge classes with `cn()` from `@/lib/utils`. It knows the spacing tokens (`control*`, `space*`), so a later `h-auto` replaces an earlier `h-control`. Add any new spacing token to its list.
- No custom CSS for what Tailwind covers. `src/App.css` only styles the generated markdown preview, with the same tokens.
- All controls share one radius, `rounded-sm` (8px). Badges (`ui/badge.jsx`: properties, links, the symlink badge in a title bar) are pills (`rounded-full`).

## Spacing tokens (`src/index.css`)
`--space-lg` 24px, `--space` 16px, `--space-sm` 8px, `--space-xs` 4px. Classes: `p-space`, `gap-space-sm`, `px-space-xs`, `inset-x-space`… A spacing of 4, 8, 16 or 24px is always the token, never `p-1`, `gap-2`, `px-4` or `mt-6`; the in-between ones (6, 10, 12px) and the half steps have none and stay as they are.
- **24px:** the desktop rail's padding left and bottom.
- **16px (base):** gutters around the content box, the content's padding on every side, gaps between them, the Surface's distance from the screen's edges.
- **8px:** inside a piece (title bar, list and tree padding, gaps between buttons).
- **4px:** a title's own side padding in title bars.

## Control sizes (tokens in `src/index.css`)
- **Base 40px** (`h-control`, `size-control`, `min-h-control`): every tappable or input element: `Button` default and `size="icon"`, `Input`, menu items, list rows, sheet and dialog close.
- **Medium 32px** (`-md`): the folder tree's chevrons, and every button inside something that is itself hoverable or tappable: a list row's, tile's or card's ⋯, ✏️, 🗑 or color swatch (`ColorPicker` `className`). In a menu item (padding 8px above and below) it sits in a wrapper with `-my-1`, so the item stays base height (40px) like the others; `-mr-2` lines its glyph up with the other right-aligned content (a count, a ✓).
- **Small 24px** (`-sm`, `Button size="sm"`): secondary controls beside a title; a link badge's ⋯ in the note preview, to fit the line of text.
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
| `bg-primary` / `text-primary` | Accent (a muted teal green): fills and icons |
| `text-primary-ink` / `text-destructive-ink` / `text-success-ink` | Every colored text (links, Today, red menu items and errors, green text): the color mixed with the text color by `--ink` (70%), so it's darker on light and lighter on dark. Badge values (`--tag-N`) and callout titles mix the same way. Never `text-primary` for text |
| `bg-destructive` | Errors, danger |
| `bg-success` / `text-success-foreground` | Success (green) |
| `bg-segment` / `bg-segment-active` | Segmented toggle track / selected segment (`Segmented`: fits its content by default, labeled segments 12px on their sides, icon-only ones square, 32px; `stretch`: as wide as its place, segments sharing it equally, 4px on their sides) |
| `text-folder`, `text-file-image` | Folder and image file icons |
| `--tag-0`…`--tag-9`, `--tag-tint` (text: `--ink`) | Property badge colors. Every colored badge is `Badge` with a `tone` (a value's `--tag-N`, `--destructive` for a late date, `--primary` for a repeat): tinted against `--card` by `--tag-tint` (stronger on hover with `hoverable`), its text and icons the same hue mixed by `--ink`. Never a badge colored with its own classes |
| `--callout-*` | GitHub alert callouts in the preview |
| `--radius` | `0.75rem` base radius |
| `shadow-sm`…`shadow-lg` | Redefined in `src/index.css` (`@theme`): close under the element, a small drop and mostly spread |
| `border-lift-edge` | Outline of a box lifted by a shadow (hovered or dragged card): none on light, faint on dark |
| `hover-lift` | The hover of an outlined white box (a board's card, a planner's day): `shadow-md` in place of the outline (`border-lift-edge`). Defined in `src/index.css` (`@utility`); use it, not the classes it's made of |

`--safe-top` / `--safe-bottom` hold the iOS safe-area insets.

## Buttons
- Variants: `default`, `secondary`, `ghost`, `ghost-quiet` (a muted button inside something already tinted or hoverable: a faint fill on hover and while its menu is open), `ghost-outline` (no border, despite the name: a grey fill), `outline`, `link`, and the colored ones: `destructive`, `ghost-destructive` (trash for every Remove: see the AGENTS rule), `success`, `success-light`, `destructive-light`.
- Sizes: `default` (40px), `icon` (40px square), `icon-md` (32px square, for buttons inside a row, tile, card or tray), `md`, `sm`. The icon sizes don't shrink in a flex row.
- **`MoreButton`** (`components/MoreButton.jsx`) is every ⋯ that opens a menu (a `DropdownMenuTrigger asChild`): in a title row a `ghost-outline` base button with a 20px ⋯, `inRow` a quiet medium one with a 16px ⋯, `reveal` shown only while its row is hovered with a mouse (`REVEAL`).
- Confirm and dismiss icon buttons: `success` / `destructive` alone, `success-light` / `destructive-light` side by side.

## Icons
- Icons are 16px (`size-4`); `Button` and menu items size them, so don't pass size classes.
- **File icons** (`FileIcon`, 20px): folder yellowish (`text-folder`), note and other files in the accent green (`text-primary`), PDF red (`text-destructive`), image green (`text-file-image`). A symlink shows its target's icon with a small ↗ in the corner.

## List rows and cards
- **`ListRow`** (`ui/list-row.jsx`) is every list's row: file manager, tree, search, move, backlinks, popover lists. Icon left, title (with the changed dot), optional muted description (a second line in a row narrower than 640px (phones, dialogs like Search); from 640px wide (a container query on the row) at the right, next to the trailing slot, in the title's size, at most half the row), `trailing` slot (⋯), `leading` before the button (tree indent and chevron). Base height, rounded, highlighted on hover or while its ⋯ is open. States: `active` (the open or selected item: light accent fill and accent text, `SELECTED`, the same as the rail's open page; every selection looks like this), `dimmed` (hidden files, symlinks), `disabled`. Lists don't build their own rows.
- **`CardTile`** (`ui/card-tile.jsx`, same props): file manager's cards. A 24px icon in a 48px tinted square over the name; outlined, `rounded-lg`; names up to two lines (tiles two lines tall only when some name in the folder wraps, measured in `FileBrowser`); ⋯ in the corner on hover.
- **`Tray`** / **`TrayTitle`** (`ui/tray.jsx`): a tinted box rounded a bit more than cards (`rounded-xl`, 16px; the Properties box too) grouping what's in it under a small title (`grip`: the drag dots): a board's column, a note in the Notes widget (its name as the title). What sits in it is `bg-card`.
- **`Calendar`** (`ui/calendar.jsx`): shadcn's (`npx shadcn add calendar`, react-day-picker), its icons switched to Phosphor's and `cn` to the project's (keep that when updating it; the CLI also rewrites `ui/button.jsx`, which must be put back). `DatePopover` is shadcn's date picker with time: the Calendar (today marked lightly, since the theme's accent is its green) and, for a date with a time, a time field under it, for any date (`DateField`: a date badge in a note, a description or a date property).
- **`ListBox`** (`ui/list-row.jsx`): the scrolling list of rows in a dialog or popover (Properties, Edit widgets, Edit values). **`InlineRename`** (`components/InlineRename.jsx`): a row turned into a name field with ✓ and ✕, in the Properties and Edit values dialogs.
- **`AuthLayout`** (`components/AuthLayout.jsx`): the sign-in screens' frame (token, repository). **`BrandName`** (`components/BrandName.jsx`): the app's name in **`font-brand`**, the handwritten font (Homemade Apple, bundled with `@fontsource` so it works offline), used only for the app's name "Folio", a bit softer than the text (`text-foreground/85`): the sign-in title (`large`), the rail's header and the menu sheet's title. Both sign-in steps show **`SignInSteps`** on top (① Token — ② Repo: numbered dots and names, the current one filled, a done one with a ✓; on the repo step, Token goes back to the token step, still signed in, with the token filled in: Continue keeps it, a changed one Connects anew, `editToken` in `useAuth`), then the leaf logo and `BrandName`. The repository step lists the token's repos as one-of-several choices (`Radio` rows) as they load, writable first and the first one chosen, with a search field above them once there are more than 10 (the list then keeps its full height, 256px, whatever it finds; nothing found says so in a small line), and a last row to type a repo the list leaves out; Continue checks the token can write there (`canWriteRepo`). **`LockMark`**: the small lock before a locked note's title.
- **`Placeholder`** (`ui/placeholder.jsx`): light text for what isn't filled in yet (Untitled, No value).
- **`EmptyMessage`** (`components/EmptyState.jsx`): the muted centered line for what a list or page has nothing of, `size` sm / md / lg for the air around it. Never a hand-written `<p>`.
- **`EmptyState`** (`components/EmptyState.jsx`): a widget's broken or empty state in its place: a muted message and a secondary button to put it right (Select folder, Select note).

## Tooltips
shadcn's (`ui/tooltip.jsx`): dark on light, text-sm, after 300ms (`TooltipProvider` in App), on mouse hover and keyboard focus, never on a tap. The `tooltip` prop of `Button` (`tooltipSide`), `ListRow` and `CardTile` (on the whole row, so a row that can't be opened explains why), or wrap in `Tip`.

## Overlays
- **`ConfirmModal`:** one confirmation for every destructive action (title, description, Cancel, a red confirm button, an optional milder `alternative`). `DeleteModal` is its wording for files, folders and views.
- **`BottomSheet`:** every prompt: a sheet on mobile, a centered Dialog from 768px. It clears a stale page lock on close. On iOS `lib/viewport.js` scrolls the page back after the keyboard closes.
- **Dropdown menus are non-modal** (`ui/dropdown-menu`): a modal menu that opens a dialog can leave the page locked and freeze every button. An item lights up only under a mouse or with the keyboard, never left lit by a tap. On touch a menu opens on the tap, not when the finger lands, so starting a scroll on ⋯ doesn't open it.
- **A scroll by touch closes popovers and menus** (`useOverlayOpen`, in `ui/popover` and `ui/dropdown-menu`): a finger moving outside the open panels closes them, since radix only closes on a tap outside.
- **Popover and menu size:** every `PopoverContent` and `DropdownMenuContent` is at least 11rem wide (`min-w-44`, `min-w-[11rem]`), keeps 8px from the screen's edge and is never taller than the room it has (Radix's available-height): taller content scrolls inside it. A popover with its own scroll box (the folder tree) caps that box the same way.
- **Sub popovers:** `Popover` (`ui/popover.jsx`) or a nested `DropdownMenu`, opened on the side of the item; too wide for either side (a phone), it overlays its parent, shifted until it's 8px inside the screen (`useKeepOnScreen`, in `PopoverContent` and `DropdownMenuSubContent`). Content inside a popover that opens a modal wraps it in a `contents` div with the `own` handlers so clicks stay its own.
- Loading uses `Spinner`. `PullToRefresh` wraps every screen; `data-no-pull` areas opt out.
- Toasts: `ui/sonner`, bottom center, filled (`toast.success` emerald, `toast.error` red; never a plain `toast()`), 20px icon and text, 16px padding; full width on phones. An action (Undo) is a base-size (40px) button tinted with the toast's text color.
