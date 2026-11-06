# Notes and properties

## Note page
- `Editor` switches between `MarkdownPreview` (read-only apart from task checkboxes and accordions; open accordions stay open across re-renders) and `MarkdownEditor` (highlighted textarea).
- ✏️ opens the editor at the first block on screen (`visibleOffset`); a double tap or double click on text opens it at that word (counted from two clicks, since iPhones send no dblclick). Closing the keyboard (iOS Done, tapping elsewhere, Esc) or ✓ returns to preview. The finishing ✓ follows the ✓ button rules.
- The preview never scrolls sideways: text wraps; a wide table or code block scrolls inside itself. A note's `# heading` is plain markdown.
- Images and PDFs open read-only in `FileViewer` (`useBlob`); PDFs use pdf.js (`PdfView`, loaded on first use) and draw only pages near the screen, for iOS memory. `Editor` and `FileViewer` share `FilePage`.

## Properties (front matter)
- Shown on top of the preview in a light grey box (`bg-secondary/50`) titled Properties (`PropertyBadges` with `title`; a double tap opens the editor at the start of the file; board cards use it bare), in the file's order.
- The `description` (`DESCRIPTION`) is muted text whose markdown links work like the note's own; never a badge. Every other value is a badge (no property name, no tooltip). Badges listed before the description show above it, the rest below.
- Each badge has a ▾ and opens a popover to change that property, through `useNote`'s `change` in a note and `setProperty` on a board card (both `withValue`).
- A click, press or touch inside a badge or its popover doesn't reach the note or card (`own`). The editor shows the raw block.

## Value popover (`ValueChooser`)
- A field to find or add a value, the values the notes next to it have for that key (the note's folder; on a card the whole board: `valuesOf`) with a ✓ on the current ones, then a separator and **Edit values**.
- A property with a list toggles values and stays open; a single-value property takes the chosen one (choosing it again empties it) and closes. An empty property shows its name as a badge to fill. Without `onChange` (a card being dragged) badges are plain and empty ones aren't shown.
- An outside click or Esc closes it.

## Values dialog (`ValuesModal`, from Edit values)
- One dialog with every value of the property, a field to add one (it's set on this note, like choosing it), and on each row a color swatch, a pencil and a red trash.
- **Swatch:** a sub popover on its side with the ten colors (`ColorPicker`); choosing one recolors that value at once.
- **Pencil:** the row becomes a name field (swatch and trash stay on it) with ✓ / ✕. Save renames the value, keeping its color, in every note in scope. A name another value has merges them (the row says so).
- **Trash:** closes the dialog, asks first (`ConfirmModal`, with the number of notes), then empties that value in scope.
- **Scope:** the note's folder, or the board on a card. This note changes through `change`, the others through `editNote` (`renameValue`, `withoutValue`: empty for a single value, out of the list for a list).

## Colors
- Each value has its own badge color within its property, `--tag-0`…`--tag-9` tinted by `--tag-tint` against `--card`, stronger on hover; an empty one is grey.
- Automatic (`valueColors`): a value prefers the color its name hashes to, a taken one gets the next free; up to ten values differ.
- Picked colors are saved by key and value for the whole repo (not per folder) in `.folio/colors.json` (`useTagColors`, `lib/tagColors.js`). A picked color wins over the automatic one, and other values avoid it. An unreadable file is never saved over.
