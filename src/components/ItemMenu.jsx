import { createContext, useContext, useState } from 'react'
import { PencilSimple, Trash, Folder, Rows, SquaresFour, Columns, Copy, Lock, LockOpen, FolderOpen, GithubLogo } from '@phosphor-icons/react'
import { DropdownMenuItem } from './ui/dropdown-menu.jsx'
import { Segmented } from './ui/segmented.jsx'
import RenameModal from './RenameModal.jsx'
import DeleteModal from './DeleteModal.jsx'
import MoveModal from './MoveModal.jsx'
import { EmojiSubmenu } from './EmojiPicker.jsx'
import CopyLinkItem from './CopyLinkItem.jsx'
import MoreMenu from './MoreMenu.jsx'
import { repoLink } from '../lib/markdown.js'
import { useIsDesktop } from '../hooks/useIsDesktop.js'

// What every item's ⋯ does, given once by App: `onRename(item, name, title)` and `onMove(item, folder)` (an error
// message or null), `onDuplicate(item)`, `onDelete(item)` (to the archive), `folders` (Move's choices), `isLocked(path)`
// and `onToggleLock(path)` (null while locks can't be saved), `onReveal(item)` (its folder in File manager) and
// `githubUrl(item)` (where it is on GitHub; undefined when GitHub doesn't have it yet)
export const ItemActionsContext = createContext(null)

// The ⋯ of a file or folder ({ name, path, type }) everywhere it shows: file manager, tree, title bar, Assets, a board's
// or planner's card, a pinned note or folder. Its sections (MoreMenu):
//   - what only this place offers (`extra`: Mark as done, Edit description, Move to column…), and Show in folder (`reveal`);
//   - the core, the same everywhere: Rename · Emoji · Move to… · Duplicate (files) · Copy link · Open on GitHub · Lock (notes);
//   - Remove (to the archive, confirmed; none for a locked note), or `remove` ({ label, onSelect }, confirmed by the caller:
//     a pinned item's Remove from widget).
// With no `item` (the root folder; a pinned item that's gone) only `extra` and `remove` show. `view` / `onView` (File
// manager's title bar): an icon-only List | Cards | Columns switch on top (Columns from 768px). `inList`: inside a row (a
// medium quiet ⋯), `hoverReveal`: hidden until the row is hovered, with a mouse (MoreMenu). `label`: the ⋯'s aria-label.
const VIEWS = [['list', 'List', Rows], ['cards', 'Cards', SquaresFour], ['columns', 'Columns', Columns]]

export default function ItemMenu({ item, extra, reveal, remove, view, onView, inList, hoverReveal, label = 'More actions', className }) {
  const actions = useContext(ItemActionsContext)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [moving, setMoving] = useState(false)
  const [open, setOpen] = useState(false)
  const desktop = useIsDesktop()
  const file = item && item.type !== 'dir'
  const note = file && item.path.endsWith('.md')
  const locked = note && actions.isLocked(item.path)
  const github = item && actions.githubUrl(item)

  const core = item && <>
    <DropdownMenuItem onSelect={() => setRenaming(true)}><PencilSimple /> Rename</DropdownMenuItem>
    <EmojiSubmenu path={item.path} onDone={() => setOpen(false)} />
    <DropdownMenuItem onSelect={() => setMoving(true)}><Folder /> Move to…</DropdownMenuItem>
    {file && <DropdownMenuItem onSelect={() => actions.onDuplicate(item)}><Copy /> Duplicate</DropdownMenuItem>}
    <CopyLinkItem link={repoLink(item.path)} />
    {github && (
      <DropdownMenuItem asChild>
        <a href={github} target="_blank" rel="noreferrer"><GithubLogo /> Open on GitHub</a>
      </DropdownMenuItem>
    )}
    {note && (
      <DropdownMenuItem disabled={!actions.onToggleLock} onSelect={() => actions.onToggleLock(item.path)}>
        {locked ? <><LockOpen /> Unlock</> : <><Lock /> Lock</>}
      </DropdownMenuItem>
    )}
  </>
  const removal = remove
    ? <DropdownMenuItem variant="destructive" disabled={!remove.onSelect} onSelect={remove.onSelect}><Trash /> {remove.label}</DropdownMenuItem>
    : item && !locked && <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}><Trash /> Remove</DropdownMenuItem>

  return (
    <>
      <MoreMenu
        label={label} inRow={inList} reveal={hoverReveal} className={className} open={open} onOpenChange={setOpen}
        sections={[
          onView && (
            <div className="p-space-xs">
              <Segmented stretch value={view} onChange={onView} options={desktop ? VIEWS : VIEWS.filter(([v]) => v !== 'columns')} label="View" iconOnly />
            </div>
          ),
          <>
            {extra}
            {item && reveal && <DropdownMenuItem onSelect={() => actions.onReveal(item)}><FolderOpen /> Show in folder</DropdownMenuItem>}
          </>,
          core,
          removal,
        ]}
      />

      {renaming && (
        <RenameModal
          item={item}
          onRename={(name, title) => {
            const err = actions.onRename(item, name, title)
            if (!err) setRenaming(false)
            return err
          }}
          onClose={() => setRenaming(false)}
        />
      )}

      {deleting && (
        <DeleteModal
          item={item}
          onDelete={() => { setDeleting(false); actions.onDelete(item) }}
          onClose={() => setDeleting(false)}
        />
      )}

      {moving && (
        <MoveModal
          item={item}
          folders={actions.folders}
          onMove={actions.onMove}
          onClose={() => setMoving(false)}
        />
      )}
    </>
  )
}
