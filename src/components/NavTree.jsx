import { createContext, forwardRef, useContext, useState } from 'react'
import { CaretDown, CaretRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import FileIcon from './FileIcon.jsx'
import { withoutEmoji } from '../lib/icons.js'
import ItemMenu from './ItemMenu.jsx'
import { ListRow } from './ui/list-row.jsx'
import { LINK_ERRORS } from '../lib/files.js'
import { fileItem } from '../lib/folderNotes.js'
import { EmptyMessage } from './EmptyState.jsx'

// What the title bar's folder tree needs from App: `listDir(dir)`, `symlinks`, the `current`
// path (open file or folder), the open `file` (null for a folder), `dir` (the open folder, or the open file's), the open folders
// (`expanded`, `onToggle`), `onOpenFolder` / `onOpenFile`, `itemActions` for each row's ⋯
// (ItemMenu's onRename / onDuplicate / onDelete / onMove / folders, as in File manager), the title
// bar's `onBack` (null without a step back), `viewTree()` (on a view's page: its widgets and what they show, as nodes; null elsewhere), and for the root's RepoMenu the open `repo`, the `repos` used on
// this device and `onSwitchRepo(repo)`.
export const NavContext = createContext(null)

// A row of a tree: indented by `depth`, a chevron when it has children (`open`, `onToggle`), then the ListRow
// (`row`: its own props)
function TreeRow({ depth, branch, open, onToggle, row }) {
  return (
    <ListRow
      rowProps={row.active ? { 'data-current': '' } : undefined}
      leading={<>
        <span aria-hidden="true" className="shrink-0" style={{ width: `${depth}rem` }} />
        {branch ? (
          <Button
            variant="ghost-quiet" size="icon-md" className="ml-space-xs"
            aria-label={open ? 'Collapse' : 'Expand'} aria-expanded={open}
            onClick={onToggle}
          >
            <CaretRight className={cn('transition-transform', open && 'rotate-90')} />
          </Button>
        ) : <span aria-hidden="true" className="ml-space-xs w-control-md shrink-0" />}
      </>}
      {...row}
    />
  )
}

function Rows({ dir, depth }) {
  const nav = useContext(NavContext)
  return nav.listDir(dir).map(item => {
    const link = nav.symlinks[item.path] // undefined unless a symlink (then {} while loading)
    const isLink = item.path in nav.symlinks
    const folder = item.type === 'dir' // a symlinked folder isn't expanded
    const open = folder && nav.expanded.has(item.path)
    const openable = isLink ? !!link?.kind : true
    return (
      <li key={item.path}>
        <TreeRow depth={depth} branch={folder} open={open} onToggle={() => nav.onToggle(item.path)} row={{
          icon: isLink
            ? <FileIcon path={link?.path ?? item.path} dir={link?.kind === 'folder'} link />
            : <FileIcon path={item.path} dir={folder} />,
          title: withoutEmoji(item.name),
          changed: item.changed,
          dimmed: item.name.startsWith('.') || isLink,
          disabled: !openable,
          tooltip: link?.error ? `${item.name} ${LINK_ERRORS[link.error]}` : link?.path ? `Symlinked from ${link.path}` : undefined,
          onClick: () => folder ? nav.onOpenFolder(item.path) : nav.onOpenFile(item.path), // a symlink opens its source (App)
          trailing: <ItemMenu item={item} {...nav.itemActions} inList hoverReveal />,
          active: nav.current === item.path,
        }} />
        {open && <ul><Rows dir={item.path} depth={depth + 1} /></ul>}
      </li>
    )
  })
}

// A view's tree (`viewTree`): nodes { key, name, icon (a Phosphor icon) or path (a note), children? }: its widgets,
// then what each shows (a board's columns and their cards, a Notes widget's notes…). `expanded`: the open nodes' keys.
// A note opens in the view; a node with children only expands and collapses.
function NodeRows({ nodes, depth, expanded, onToggle }) {
  const nav = useContext(NavContext)
  return nodes.map(node => {
    const open = expanded.has(node.key)
    const Icon = node.icon
    return (
      <li key={node.key}>
        <TreeRow depth={depth} branch={!!node.children} open={open} onToggle={() => onToggle(node.key)} row={node.path ? {
          icon: <FileIcon path={node.path} />,
          title: node.name,
          onClick: () => nav.onOpenFile(node.path),
          trailing: <ItemMenu item={fileItem(node.path)} {...nav.itemActions} inList hoverReveal />,
          active: nav.current === node.path,
        } : {
          icon: Icon && <Icon className="text-muted-foreground" />,
          title: node.name,
          onClick: () => onToggle(node.key),
        }} />
        {open && node.children?.length > 0 && <ul><NodeRows nodes={node.children} depth={depth + 1} expanded={expanded} onToggle={onToggle} /></ul>}
      </li>
    )
  })
}

// The keys of the nodes that hold `path`, so the open note shows when the tree opens
const holding = (nodes, path) => nodes.flatMap(n => {
  const inner = n.children ? holding(n.children, path) : []
  return inner.length || n.children?.some(c => c.path === path) ? [n.key, ...inner] : []
})

// The popover's scroll box, on opening: scrolls the open item (`data-current`, see TreeRow) to its middle.
// Positions come from offsetTop, so the popover's opening animation doesn't skew them
const showCurrent = box => {
  const row = box?.querySelector('[data-current]')
  if (row) box.scrollTop = row.offsetTop - (box.clientHeight - row.offsetHeight) / 2
}

// A view's tree in the popover, the nodes holding the open note expanded
function ViewTree({ nodes }) {
  const nav = useContext(NavContext)
  const [expanded, setExpanded] = useState(() => new Set(holding(nodes, nav.current)))
  const toggle = key => setExpanded(prev => { const next = new Set(prev); if (!next.delete(key)) next.add(key); return next })
  return <ul><NodeRows nodes={nodes} depth={0} expanded={expanded} onToggle={toggle} /></ul>
}

// The look of a title that opens a menu: an outlined button in the buttons' own font, with the item's
// `icon` (FileIcon), its name, the blue dot of unsaved changes (`changed`) right after it, and ▾ on the right (the folder tree here, RepoMenu at File manager's root); `bare`: no outline of its own, for a button inside
// a box that has one (`FolderTreeMenu` with badges)
export const TitleMenuButton = forwardRef(function TitleMenuButton({ icon, children, changed, bare, className, ...props }, ref) {
  return (
    <Button ref={ref} variant={bare ? 'ghost' : 'outline'} className={cn('min-w-0 max-w-full gap-space-sm px-3', className)} {...props}>
      {icon}
      <span className="truncate">{children}</span>
      {changed && <span aria-label="Unsaved changes" className="size-1.5 shrink-0 rounded-full bg-primary" />}
      <CaretDown className="text-muted-foreground" />
    </Button>
  )
})

// The title of a file or folder: its `name` as a button that opens a popover with the tree of the folder
// you're in (an open file's folder, or an open folder's parent with the folder itself open in it), its subfolders expandable; `badge` (symlinks pointing here) sits inside the button's outline, after ▾; on a view's page, the view's own
// tree instead (`viewTree`: its widgets and what they show). It opens scrolled to the open item. Choosing a note or folder opens it and closes the popover.
export function FolderTreeMenu({ name, changed, badge }) {
  const nav = useContext(NavContext)
  const [open, setOpen] = useState(false)
  if (!nav) return name
  const close = fn => path => { setOpen(false); fn(path) }
  const viewTree = open && nav.viewTree?.()
  // An open folder is shown inside its parent, like an open file among its siblings: the folder itself (highlighted, open) with its neighbours
  const inParent = !nav.viewTree && !nav.file && nav.dir !== ''
  const top = inParent ? nav.dir.split('/').slice(0, -1).join('/') : nav.dir
  const empty = nav.viewTree ? !viewTree?.length : !nav.listDir(top).length
  const expanded = inParent ? new Set([...nav.expanded, nav.dir]) : nav.expanded
  const trigger = (
    <PopoverTrigger asChild>
      <TitleMenuButton bare={!!badge} icon={<FileIcon path={nav.current ?? ''} dir={nav.current !== nav.file} />} changed={changed}>{withoutEmoji(name)}</TitleMenuButton>
    </PopoverTrigger>
  )
  return (
    <Popover open={open} onOpenChange={setOpen}>
      {badge ? <span className="flex h-control min-w-0 max-w-full items-center gap-space-xs rounded-sm border border-input pr-space-xs shadow-sm">{trigger}{badge}</span> : trigger}
      <PopoverContent className="w-80 p-space-sm" onCloseAutoFocus={e => e.preventDefault()}>
        <div ref={showCurrent} className="relative max-h-[60vh] overflow-y-auto overscroll-y-contain" data-no-pull>
          {empty
            ? <EmptyMessage size="sm">{nav.viewTree ? 'Nothing on this view yet' : 'Empty folder'}</EmptyMessage>
            : (
              <NavContext.Provider value={{ ...nav, expanded, onToggle: path => path !== nav.dir && nav.onToggle(path), onOpenFolder: close(nav.onOpenFolder), onOpenFile: close(nav.onOpenFile) }}>
                {viewTree ? <ViewTree nodes={viewTree} /> : <ul><Rows dir={top} depth={0} /></ul>}
              </NavContext.Provider>
            )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
