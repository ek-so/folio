# Views and boards

## Views
- A view is a dashboard (`ViewPage`): a title bar with ⋯ and + → Add widget (every kind in `widgets/index.js`) over its widgets stacked full width, then an Add widget button under them. Empty: an Add button per kind.
- The view's ⋯: Edit widgets (`EditListModal`: drag rows into order, saved on each drop by `moveWidget`; a row's trash removes that widget, confirmed on top of the sheet), Rename, Remove. The navigation's ⋯ keeps only Rename and Remove. A kind this version doesn't know is kept, shown as such, and can be removed. Saved in `.folio/views.json` (`lib/viewsConfig.js`); a file that can't be read shows Home and can't be changed.
- Add view asks for a name first (`NewFileModal` `kind="view"`; no name = Untitled), then creates and opens it. Rename / Remove go through `RenameModal` / `DeleteModal` with `kind="view"`. Any view, Home too, can be removed (confirmed); with none left File manager is first.

## Widgets
- Self-contained, one folder each, one line in `widgets/index.js`. A widget gets only `services`: `files`, `folders`, `notes`, `remoteFiles`, `remoteText`, `repoName`, `canEdit`, `config`, `tagColors`, `update`, `openFile`, `openFolder`, `move`, `moveAll`, `rename`, `remove`, `createFolder`, `newNote`, `addNote`, `noteFile`, `saveNote`, `virtual`, `discards`.
- Optional `title(id, services)` names it in Edit widgets (a board: its folder; a note: its file name), else its label.
- `moved(ch, id, from, to, isDir, services)` follows renames and moves; `removed(ch, id, services)` drops its settings. Optional `fileMoves(id, path, services)` gives the columns an open file can move to.

## Board (`widgets/board/`)
- **Settings:** `.folio/boards/<id>.json`: `folder`, `properties` shown on cards, `hidden` columns, `columns` order, `cards` order per column. Pure logic in `board.js` (tested): `boardColumns`, `movedBoard`, `placeCard`, `moveColumn`, `editNotes`, `withBoardKeys`, `emptyColumn`.
- **Structure:** a folder whose direct subfolders are columns and whose files, at any depth inside a column, are cards. Files right in the folder show in a No status column first, only while there are any. Technical files and folders (a name starting with `.` or `_`, anywhere in the path) stay off the board, and its property changes leave them and symlinks alone.
- **Card:** the note's title (`noteTitle`: `title` property, else first `# heading`, else file name), its `description` (cut after three lines) and the chosen properties' values. Page background with an outline; on hover and while dragged a shadow replaces the outline. Tapping opens the file in the view (a div with `role="button"`, since its badges are buttons).
- **Card ⋯ (`CardMenu`):** Edit title (sets the `title` property, or takes it out when emptied: `withTitle`; the file keeps its name; only for a note on this device), Move to column (a sub menu of the shown columns, the card's own ticked and disabled; moves the card to the end of that column like a drop; then Edit columns…, which opens the Columns dialog) and Remove (`DeleteModal`). A note opened from a view that has its board gets the same Move to column in its title bar's ⋯ (`ItemMenu` `columns`, from the widget's `fileMoves`).
- **Dragging:** cards and columns drag into any order (`@dnd-kit`, on touch after holding 0.25s). The order is saved in the board's file. A card dropped in another column moves its file into that column's folder (`handleMove`, so links follow; a taken name is refused as a toast). A column moves by its title; No status stays first.
- **Board ⋯:**
  - **Columns** (`CheckListModal`): tick the columns to show; each row has a folder button (opens that column's folder, ← returns to the board) and a trash; a New column field creates one right away.
  - **Properties** (`CheckListModal`): tick the keys its notes have, or add a new name (`keyNameError`); a newly chosen key is added, empty, to every note of the board. A row's pencil renames the key in every note (refused if a note already has the new name); its red trash removes it from all of them, confirmed.
  - **Remove board:** confirmed; deletes its settings file (removing a view removes its boards).
- **Column ⋯:** Rename, Remove (an empty one plainly; with cards: Remove with cards, or Move to No status, which moves every file in it into the board's folder, numbering taken names, then removes the folder). New card under each column creates a note there with the board's properties, empty, and stays on the board. Creating a board gives every note in its folder an empty `description`.

## Note (`widgets/note/`)
- **Settings:** `.folio/notes/<id>.json`: `file`, the note it shows. Pure logic in `note.js` (tested): `parseNote`, `movedNote` (the note follows renames and moves), `folderNotes`.
- **Add:** pick a folder (`FolderSheet`), then one of the `.md` files right in it, or **New note…** (`NewFileModal`), which creates the note and the widget in one step (`addNote`, App's `noteToAdd`, shared with New note).
- **Widget:** the note's file name (also in Edit widgets), ✏️ Edit (✓ when done) and ⋯ (Open full screen, Rename: renames the file as anywhere else, `RenameModal`; Remove). Below, the note in a box of fixed height (`h-80`) that scrolls inside: `MarkdownPreview`, or `MarkdownEditor` while editing (Edit, or a double tap at the tapped word, like on the note's page). Edits save on their own through `useNote` and `saveNote`, like on the note's page; ticking a checkbox in the preview edits too.
- **Full screen** opens the note in the view, like a board's card (typing is saved first). A note that's gone shows as such; the widget can still be removed. Removing it keeps the note.
