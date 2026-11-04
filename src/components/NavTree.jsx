import { createContext, useContext, useState } from 'react'
import { CaretRight, SidebarSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet.jsx'
import FileIcon from './FileIcon.jsx'
import Spinner from './Spinner.jsx'
import { LINK_ERRORS } from '../lib/files.js'

// What the file tree needs from App: `listDir(dir)`, `symlinks`, the `current`
// path, the open folders (`expanded`, `onToggle`) and `onOpenFolder` /
// `onOpenFile`.
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
        <div className={cn('flex h-control items-center rounded-sm pr-1 transition-colors hover:bg-secondary/60', nav.current === item.path && 'bg-secondary')}>
          <span aria-hidden="true" className="shrink-0" style={{ width: `${depth}rem` }} />
          {folder ? (
            <Button
              variant="ghost" size="icon" className="size-control-md shrink-0 text-muted-foreground hover:bg-muted-foreground/10"
              aria-label={open ? 'Collapse' : 'Expand'} aria-expanded={open}
              onClick={() => nav.onToggle(item.path)}
            >
              <CaretRight className={cn('transition-transform', open && 'rotate-90')} />
            </Button>
          ) : <span aria-hidden="true" className="w-control-md shrink-0" />}
          <Button
            variant="ghost"
            className={cn('h-full flex-1 min-w-0 justify-start gap-2 px-1 rounded-sm font-normal text-left hover:bg-transparent disabled:opacity-100', (item.name.startsWith('.') || isLink) && 'opacity-50 disabled:opacity-50')}
            disabled={!openable}
            title={link?.error ? `${item.name} ${LINK_ERRORS[link.error]}` : link?.path ? `Symlinked from ${link.path}` : undefined}
            onClick={() => {
              if (folder) {
                nav.onOpenFolder(item.path)
                if (!open) nav.onToggle(item.path)
              } else nav.onOpenFile(item.path) // a symlink opens its source (App)
            }}
          >
            {isLink
              ? <FileIcon path={link?.path ?? item.path} dir={link?.kind === 'folder'} link />
              : <FileIcon path={item.path} dir={folder} />}
            <span className="flex-1 truncate">{item.name}</span>
            {item.changed && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
          </Button>
        </div>
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

// Desktop: the tree in its own box next to the content, titled with the repo's name
export function NavPanel() {
  const nav = useContext(NavContext)
  if (!nav) return null
  return (
    <aside aria-label="Files and folders" className="hidden md:flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="shrink-0 border-b border-border p-4">
        <h2 className="flex h-control items-center truncate px-0 text-base font-bold">{nav.repoName}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-2">
        <FileTree />
      </div>
    </aside>
  )
}

// Phones: a button in the title bar that opens the tree in a floating drawer
// (card-colored, rounded, 16px from the screen's edges)
export function NavDrawerButton() {
  const nav = useContext(NavContext)
  const [open, setOpen] = useState(false)
  if (!nav) return null
  const close = fn => path => { setOpen(false); fn(path) }
  return (
    <>
      <Button variant="ghost-outline" size="icon" aria-label="Files and folders" className="shrink-0 border-muted-foreground/50 md:hidden" onClick={() => setOpen(true)}>
        <SidebarSimple />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="top-[calc(1rem+var(--safe-top))] bottom-[calc(1rem+var(--safe-bottom))] left-4 h-auto gap-0 overflow-hidden rounded-xl border bg-card">
          <SheetHeader className="p-2 pl-4">
            <SheetTitle className="flex h-control items-center truncate pr-12">{nav.repoName}</SheetTitle>
            <SheetDescription className="sr-only">Files and folders</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-2">
            <NavContext.Provider value={{ ...nav, onOpenFolder: close(nav.onOpenFolder), onOpenFile: close(nav.onOpenFile) }}>
              <FileTree />
            </NavContext.Provider>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
