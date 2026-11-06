import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { ArrowsInLineVertical, CaretRight, SidebarSimple, TreeView } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { Separator } from './ui/separator.jsx'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './ui/sheet.jsx'
import FileIcon from './FileIcon.jsx'
import ItemMenu from './ItemMenu.jsx'
import { ListRow } from './ui/list-row.jsx'
import Spinner from './Spinner.jsx'
import { LINK_ERRORS } from '../lib/files.js'
import { canMoveTo } from '../lib/changes.js'
import ResizeHandle from './ResizeHandle.jsx'
import RepoMenu from './RepoMenu.jsx'
import { useResizableWidth } from '../hooks/useResizableWidth.js'
import { TREE_WIDTH } from '../lib/resize.js'
import { storage } from '../lib/storage.js'

// What the file tree needs from App: `listDir(dir)`, `symlinks`, the `current`
// path, the open folders (`expanded`, `onToggle`, `onCollapseAll`), `onOpenFolder` /
// `onOpenFile`, `itemActions` for each row's ⋯ (ItemMenu's onRename / onDuplicate / onDelete / onMove / folders, as in File manager), and for
// drag and drop `onDropMove(item, folder)` / `onUpload(files, folder)`, and for the
// title's RepoMenu the open `repo`, the `repos` used on this device and `onSwitchRepo(repo)`.
export const NavContext = createContext(null)

// Drag and drop in the desktop tree (null in the phone drawer)
const DragContext = createContext(null)

const HOVER_OPEN_MS = 600 // a collapsed folder held under a drag opens after this

const parentOf = path => path.slice(0, Math.max(path.lastIndexOf('/'), 0))

// Rows move into the folder they're dropped on (on a file: its folder; on
// the empty area: the root); files from the device upload there.
function useTreeDrag(nav) {
  const dragging = useRef(null) // the row being dragged, for event handlers
  const [draggingPath, setDraggingPath] = useState(null) // for rendering only
  const [target, setTarget] = useState(null) // folder under the pointer ('' is the root), or null
  const timer = useRef({}) // { path, id }: a collapsed folder about to open
  const navRef = useRef(nav) // the latest, for the hover timer
  useEffect(() => { navRef.current = nav })

  const clearTimer = () => { clearTimeout(timer.current.id); timer.current = {} }
  useEffect(() => clearTimer, [])

  function end() {
    dragging.current = null
    setDraggingPath(null)
    setTarget(null)
    clearTimer()
  }

  return {
    draggingPath,
    target,
    start(e, item) {
      e.stopPropagation()
      dragging.current = item
      setDraggingPath(item.path)
      e.dataTransfer.effectAllowed = 'move'
    },
    end,
    // Over a row or the empty area, aimed at `folder`; `collapsed`: a closed folder row
    over(e, folder, collapsed) {
      e.stopPropagation()
      const files = !dragging.current && e.dataTransfer.types.includes('Files')
      const ok = files || (dragging.current && canMoveTo(dragging.current, folder))
      const opening = ok && collapsed ? folder : undefined
      if (timer.current.path !== opening) clearTimer()
      if (!ok) return setTarget(null)
      e.preventDefault()
      e.dataTransfer.dropEffect = files ? 'copy' : 'move'
      setTarget(folder)
      if (opening !== undefined && !timer.current.id) {
        timer.current = { path: folder, id: setTimeout(() => {
          timer.current = {}
          if (!navRef.current.expanded.has(folder)) navRef.current.onToggle(folder)
        }, HOVER_OPEN_MS) }
      }
    },
    leave(e) {
      if (e.currentTarget.contains(e.relatedTarget)) return
      setTarget(null)
      clearTimer()
    },
    drop(e, folder) {
      e.preventDefault()
      e.stopPropagation()
      const item = dragging.current
      end()
      if (item) nav.onDropMove(item, folder)
      else nav.onUpload([...e.dataTransfer.files], folder)
    },
  }
}

function Rows({ dir, depth }) {
  const nav = useContext(NavContext)
  const drag = useContext(DragContext)
  return nav.listDir(dir).map(item => {
    const link = nav.symlinks[item.path] // undefined unless a symlink (then {} while loading)
    const isLink = item.path in nav.symlinks
    const folder = item.type === 'dir' // a symlinked folder isn't expanded
    const open = folder && nav.expanded.has(item.path)
    const openable = isLink ? !!link?.kind : true
    const dropFolder = folder ? item.path : parentOf(item.path)
    const dragProps = drag && {
      draggable: true,
      onDragStart: e => drag.start(e, item),
      onDragEnd: drag.end,
      onDragOver: e => drag.over(e, dropFolder, folder && !open),
      onDrop: e => drag.drop(e, dropFolder),
    }
    return (
      <li key={item.path}>
        <ListRow
          leading={<>
            <span aria-hidden="true" className="shrink-0" style={{ width: `${depth}rem` }} />
            {folder ? (
              <Button
                variant="ghost" size="icon" className="ml-1 size-control-md shrink-0 text-muted-foreground hover:bg-muted-foreground/10"
                aria-label={open ? 'Collapse' : 'Expand'} aria-expanded={open}
                onClick={() => nav.onToggle(item.path)}
              >
                <CaretRight className={cn('transition-transform', open && 'rotate-90')} />
              </Button>
            ) : <span aria-hidden="true" className="ml-1 w-control-md shrink-0" />}
          </>}
          icon={isLink
            ? <FileIcon path={link?.path ?? item.path} dir={link?.kind === 'folder'} link />
            : <FileIcon path={item.path} dir={folder} />}
          title={item.name}
          changed={item.changed}
          dimmed={item.name.startsWith('.') || isLink}
          disabled={!openable}
          tooltip={link?.error ? `${item.name} ${LINK_ERRORS[link.error]}` : link?.path ? `Symlinked from ${link.path}` : undefined}
          onClick={() => {
            if (folder) {
              nav.onOpenFolder(item.path)
              if (!open) nav.onToggle(item.path)
            } else nav.onOpenFile(item.path) // a symlink opens its source (App)
          }}
          trailing={<ItemMenu item={item} {...nav.itemActions} inList hoverReveal />}
          active={nav.current === item.path}
          className={cn(
            drag?.draggingPath === item.path && 'opacity-40',
            folder && drag?.target === item.path && 'bg-primary/10 ring-1 ring-inset ring-primary/40',
          )}
          rowProps={dragProps}
        />
        {open && <ul><Rows dir={item.path} depth={depth + 1} /></ul>}
      </li>
    )
  })
}

// Folders and files of the repo, from the root's own level
function FileTree() {
  const nav = useContext(NavContext)
  if (nav.loading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (!nav.listDir('').length) return <p className="py-8 text-center text-sm text-muted-foreground">No notes yet</p>
  return <ul><Rows dir="" depth={0} /></ul>
}

// The tree titled with the repo's name, over the box it's in (desktop panel
// or phone drawer), with Collapse all on the right (disabled while no top-level folder is open),
// then on desktop the rail's collapse icon (SidebarSimple) that hides the panel (`onToggleTree`; the rail then shows a tree button to bring it back).
// `Title`: the heading element (the drawer's is its dialog title); `closable`: leaves room for the drawer's ✕, after a separator (not on desktop).
// `dnd`: drag and drop (desktop only; unreliable with touch).
function TreePanel({ Title = 'h2', closable, dnd }) {
  const nav = useContext(NavContext)
  const drag = useTreeDrag(nav)
  const anyOpen = nav.listDir('').some(item => item.type === 'dir' && nav.expanded.has(item.path))
  return (
    <>
      <div className={cn('flex shrink-0 items-center gap-space-sm border-b border-border p-space-sm', closable && 'pr-14')}>
        <Title className="flex min-w-0 flex-1 items-center text-base font-bold"><RepoMenu /></Title>
        <Button variant="ghost" size="icon" className="shrink-0" aria-label="Collapse all folders" tooltip="Collapse all folders" disabled={!anyOpen} onClick={nav.onCollapseAll}>
          <ArrowsInLineVertical />
        </Button>
        {closable
          ? <Separator orientation="vertical" className="data-[orientation=vertical]:h-6" />
          : (
            <Button variant="ghost" size="icon" className="shrink-0" aria-label="Hide file tree" tooltip="Hide file tree" onClick={nav.onToggleTree}>
              <SidebarSimple />
            </Button>
          )}
      </div>
      <div
        className={cn('min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-space-sm pt-space pb-space-sm transition-colors rounded-b-xl', dnd && drag.target === '' && 'bg-primary/5 ring-2 ring-inset ring-primary/40')}
        {...dnd && {
          onDragOver: e => drag.over(e, ''),
          onDragLeave: drag.leave,
          onDrop: e => drag.drop(e, ''),
        }}
      >
        <DragContext.Provider value={dnd ? drag : null}>
          <FileTree />
        </DragContext.Provider>
      </div>
    </>
  )
}

// Desktop: the tree in its own box next to the content. The 16px gap to the
// content is a drag handle (also ←/→ keys) that resizes it; the width is remembered.
// Hidden while `treeCollapsed` (remembered too).
export function NavPanel() {
  const nav = useContext(NavContext)
  const [width, resize] = useResizableWidth(TREE_WIDTH, storage.getTreeWidth, storage.setTreeWidth)
  if (!nav || nav.treeCollapsed) return null
  return (
    <div style={{ width }} className="relative hidden md:block shrink-0 max-w-[35vw]">
      <aside aria-label="Files and folders" className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
        <TreePanel dnd />
      </aside>
      <ResizeHandle label="Resize file tree" size={width} limits={TREE_WIDTH} onResize={resize} />
    </div>
  )
}

// Phones: a button in the title bar that opens the same panel in a floating
// drawer (8px from the screen's edges); its ✕ is the sheet's own
export function NavDrawerButton() {
  const nav = useContext(NavContext)
  const [open, setOpen] = useState(false)
  if (!nav) return null
  const close = fn => path => { setOpen(false); fn(path) }
  return (
    <>
      <Button variant="ghost-outline" size="icon" aria-label="Files and folders" className="shrink-0 border-muted-foreground/50 md:hidden" onClick={() => setOpen(true)}>
        <TreeView />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="top-[calc(var(--space-sm)+var(--safe-top))] bottom-[calc(var(--space-sm)+var(--safe-bottom))] left-space-sm h-auto w-[calc(100vw-2*var(--space-sm))] gap-0 min-[500px]:w-[85vw] sm:max-w-none overflow-hidden rounded-xl border bg-card">
          <SheetDescription className="sr-only">Files and folders</SheetDescription>
          <NavContext.Provider value={{ ...nav, onOpenFolder: close(nav.onOpenFolder), onOpenFile: close(nav.onOpenFile) }}>
            <TreePanel Title={SheetTitle} closable />
          </NavContext.Provider>
        </SheetContent>
      </Sheet>
    </>
  )
}
