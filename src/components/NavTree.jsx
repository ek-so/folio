import { createContext, forwardRef, useContext, useState } from 'react'
import { CaretDown, CaretRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import FileIcon from './FileIcon.jsx'
import ItemMenu from './ItemMenu.jsx'
import { ListRow } from './ui/list-row.jsx'
import { LINK_ERRORS } from '../lib/files.js'

// What the title bar's folder tree needs from App: `listDir(dir)`, `symlinks`, the `current`
// path (open file or folder), `dir` (the open folder, or the open file's), the open folders
// (`expanded`, `onToggle`), `onOpenFolder` / `onOpenFile`, `itemActions` for each row's ⋯
// (ItemMenu's onRename / onDuplicate / onDelete / onMove / folders, as in File manager), the title
// bar's `onBack` (null without a step back), and for the root's RepoMenu the open `repo`, the `repos` used on
// this device and `onSwitchRepo(repo)`.
export const NavContext = createContext(null)

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
          onClick={() => folder ? nav.onOpenFolder(item.path) : nav.onOpenFile(item.path)} // a symlink opens its source (App)
          trailing={<ItemMenu item={item} {...nav.itemActions} inList hoverReveal />}
          active={nav.current === item.path}
        />
        {open && <ul><Rows dir={item.path} depth={depth + 1} /></ul>}
      </li>
    )
  })
}

// The look of a title that opens a menu: the name in bold in an outlined button, ▾ on its right
// (the folder tree here, RepoMenu at File manager's root)
export const TitleMenuButton = forwardRef(function TitleMenuButton({ children, className, ...props }, ref) {
  return (
    <Button ref={ref} variant="outline" className={cn('min-w-0 max-w-full gap-1.5 px-3 text-base font-bold', className)} {...props}>
      <span className="truncate">{children}</span>
      <CaretDown className="text-muted-foreground" />
    </Button>
  )
})

// The title of a file or folder: its `name` as a button that opens a popover with the tree of the folder
// you're in (the open folder, or the open file's), its subfolders expandable. Choosing a row opens it and
// closes the popover.
export function FolderTreeMenu({ name }) {
  const nav = useContext(NavContext)
  const [open, setOpen] = useState(false)
  if (!nav) return name
  const close = fn => path => { setOpen(false); fn(path) }
  const empty = !nav.listDir(nav.dir).length
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TitleMenuButton>{name}</TitleMenuButton>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-space-sm" onCloseAutoFocus={e => e.preventDefault()}>
        <div className="max-h-[60vh] overflow-y-auto overscroll-y-contain" data-no-pull>
          {empty
            ? <p className="py-4 text-center text-sm text-muted-foreground">Empty folder</p>
            : (
              <NavContext.Provider value={{ ...nav, onOpenFolder: close(nav.onOpenFolder), onOpenFile: close(nav.onOpenFile) }}>
                <ul><Rows dir={nav.dir} depth={0} /></ul>
              </NavContext.Provider>
            )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
