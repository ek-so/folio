import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Plus, FileText, Folder, UploadSimple, CaretRight } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import RepoMenu from './RepoMenu.jsx'
import ItemMenu from './ItemMenu.jsx'
import { ListRow } from './ui/list-row.jsx'
import { CardTile } from './ui/card-tile.jsx'
import { storage } from '../lib/storage.js'
import { splitName } from '../lib/changes.js'
import { fileKind, LINK_ERRORS } from '../lib/files.js'
import FileIcon, { iconTint } from './FileIcon.jsx'
import SymlinkedBy from './SymlinkedBy.jsx'
import Spinner from './Spinner.jsx'
import PageLayout from './PageLayout.jsx'
import { cn } from '@/lib/utils.js'
import { Separator } from './ui/separator.jsx'
import { columnFolders } from '../lib/columns.js'
import { useIsDesktop } from '../hooks/useIsDesktop.js'

export default function FileBrowser({ path, onNavigate, listDir, loading, error, notice, onSelect, onNewFile, onRename, onDuplicate, onDelete, onMove, folders, onUpload, onDropMove, symlinks = {}, linkedBy, onOpenLink }) {
  // Symlinked folders sort with the folders
  const isFolder = i => i.type === 'dir' || symlinks[i.path]?.kind === 'folder'
  const sorted = dir => { const listed = loading ? [] : listDir(dir); return [...listed.filter(isFolder), ...listed.filter(i => !isFolder(i))] }
  const items = sorted(path)
  const draggingRef = useRef(null) // always current for event handlers
  const [dragging, setDragging] = useState(null) // for rendering only
  const [dragOverPath, setDragOverPath] = useState(null)
  const [filesOver, setFilesOver] = useState(false) // files from the device dragged over the list
  const pickerRef = useRef()
  const [view, setView] = useState(storage.getFilesView) // 'list' | 'cards' | 'columns', one choice for every folder
  useEffect(() => { storage.setFilesView(view) }, [view])
  // Columns are desktop only: phones show cards instead (the choice stays for the desktop)
  const desktop = useIsDesktop()
  const layout = view === 'columns' && !desktop ? 'cards' : view

  // Cards are two label lines tall only when some name in this folder wraps; otherwise one line
  const gridRef = useRef(null)
  const [tall, setTall] = useState(false)
  const measureLabels = () => {
    const labels = [...(gridRef.current?.querySelectorAll('[data-card-label]') ?? [])]
    const wraps = labels.some(l => l.getBoundingClientRect().height > parseFloat(getComputedStyle(l).lineHeight) * 1.5)
    setTall(wraps)
  }
  useLayoutEffect(measureLabels) // after every render: names, folder or view changed
  useEffect(() => { // and when the width changes
    const grid = gridRef.current
    if (!grid) return
    const observer = new ResizeObserver(measureLabels)
    observer.observe(grid)
    return () => observer.disconnect()
  })

  // Dragging files from the device (not a row being moved)
  const isFileDrag = e => !draggingRef.current && e.dataTransfer.types.includes('Files')

  function dropFiles(e, folder) {
    e.preventDefault()
    e.stopPropagation()
    setFilesOver(false)
    setDragOverPath(null)
    onUpload([...e.dataTransfer.files], folder)
  }

  function navigate(item) {
    if (item.type === 'dir') onNavigate(item.path)
    else onSelect(item.path) // a symlink opens its source (App)
  }

  const currentFolder = path.split('/').pop()

  // One item as a card, a list row or (Columns) a row with a chevron on folders; `active`: the folder open in the next column
  function renderItem(item, active) {
    const [base, ext] = item.type === 'dir' ? [item.name, ''] : splitName(item.name)
    const isLink = item.path in symlinks
    const link = symlinks[item.path] // undefined while loading
    const openable = isLink ? !!link?.kind : item.type === 'dir' || fileKind(item.path) !== 'file'
    const isDraggedItem = dragging?.path === item.path
    const Item = layout === 'cards' ? CardTile : ListRow
    const cards = layout === 'cards'
    const columns = layout === 'columns'
    const dragProps = {
      draggable: true,
      onDragStart: e => {
        draggingRef.current = item
        setDragging(item)
        e.dataTransfer.effectAllowed = 'move'
      },
      onDragEnd: () => {
        draggingRef.current = null
        setDragging(null)
        setDragOverPath(null)
      },
      onDragOver: e => {
        if (item.type !== 'dir') return
        if (isFileDrag(e)) {
          e.preventDefault()
          e.stopPropagation()
          e.dataTransfer.dropEffect = 'copy'
          setFilesOver(true)
          setDragOverPath(item.path)
          return
        }
        const d = draggingRef.current
        if (!d || d.path === item.path) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverPath(item.path)
      },
      onDragLeave: e => {
        if (item.type !== 'dir') return
        if (!e.currentTarget.contains(e.relatedTarget)) setDragOverPath(null)
      },
      onDrop: e => {
        if (item.type === 'dir' && isFileDrag(e)) return dropFiles(e, item.path)
        const d = draggingRef.current
        if (item.type !== 'dir' || !d || d.path === item.path) return
        e.preventDefault()
        onDropMove(d, item.path)
        draggingRef.current = null
        setDragging(null)
        setDragOverPath(null)
      },
    }
    return (
      <li key={item.path}>
        <Item
          icon={isLink
            ? <FileIcon path={link?.path ?? item.path} dir={link?.kind === 'folder'} link large={cards} />
            : <FileIcon path={item.path} dir={item.type === 'dir'} large={cards} />}
          title={<>
            {base}
            {ext && <span className="text-muted-foreground">{ext}</span>}
            {isLink && <span className="text-muted-foreground"> (symlink)</span>}
            {link?.error && <span className={cn('text-sm text-muted-foreground', !cards && 'ml-2')}>{LINK_ERRORS[link.error]}</span>}
          </>}
          tint={cards ? iconTint(isLink ? (link?.path ?? item.path) : item.path, isLink ? link?.kind === 'folder' : item.type === 'dir') : undefined}
          tall={cards ? tall : undefined}
          changed={item.changed}
          onClick={() => navigate(item)}
          disabled={!openable}
          // Hidden files and links fade their icon and name only, not the row's hover or ⋯
          dimmed={!isDraggedItem && (item.name.startsWith('.') || isLink)}
          // Where a link points: the browser's own tooltip on hover
          tooltip={link?.path ? `Symlinked from ${link.path}` : undefined}
          trailing={<>
            <ItemMenu item={item} onRename={onRename} onDuplicate={onDuplicate} onDelete={onDelete} onMove={onMove} folders={folders} inList hoverReveal={cards || columns} />
            {columns && isFolder(item) && <CaretRight className="shrink-0 text-muted-foreground" />}
          </>}
          active={active}
          className={cn(
            isDraggedItem && 'opacity-40',
            dragOverPath === item.path && item.type === 'dir' && 'bg-primary/10 ring-1 ring-primary/40',
          )}
          {...(cards ? { tileProps: dragProps } : { rowProps: dragProps })}
        />
      </li>
    )
  }

  return (
    <PageLayout>
      <Surface title={
        <TitleBar
          name={path ? currentFolder : <RepoMenu />}
          badge={<SymlinkedBy links={linkedBy} onOpen={onOpenLink} />}
        >
          <ItemMenu item={path ? { name: currentFolder, path, type: 'dir' } : null} onRename={onRename} onDelete={onDelete} onMove={onMove} folders={folders} view={layout} onView={setView} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" aria-label="New" className="shrink-0">
                <Plus />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
              <DropdownMenuItem onSelect={() => onNewFile(path, 'note')}><FileText /> New note</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onNewFile(path, 'folder')}><Folder /> New folder</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => pickerRef.current?.click()}><UploadSimple /> Upload files…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={pickerRef}
            type="file"
            multiple
            hidden
            onChange={e => {
              onUpload([...e.target.files], path)
              e.target.value = '' // picking the same file again still fires
            }}
          />
        </TitleBar>
      }>
      {/* Files dropped here go into this folder, or into a folder row they're dropped on */}
      <div
        className={cn('flex-1 min-h-0 overflow-y-auto overscroll-y-contain transition-colors', filesOver && !dragOverPath && 'bg-primary/5 ring-2 ring-inset ring-primary/40')}
        onDragOver={e => {
          if (!isFileDrag(e)) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
          setFilesOver(true)
        }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) { setFilesOver(false); setDragOverPath(null) } }}
        onDrop={e => { if (isFileDrag(e)) dropFiles(e, path) }}
      >
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}
        {error && <p className="text-destructive-ink text-sm text-center pt-4 px-4">{error}</p>}
        {notice && <p className="text-muted-foreground text-xs text-center pt-3 px-4">{notice}</p>}
        {!loading && !error && items.length === 0 && layout !== 'columns' && (
          <p className="text-muted-foreground text-sm text-center py-12">No notes yet</p>
        )}
        {!loading && (layout === 'columns' ? (
          // Columns: the open folder last, after its parents; each lists its folder, the next one's row highlighted
          <div className="flex h-full min-h-0">
            {columnFolders(path).map((dir, i, dirs) => (
              <div key={i} className="contents">
                {i > 0 && <Separator orientation="vertical" />}
                <ul className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain p-space-sm">
                  {dir !== null && sorted(dir).map(item => renderItem(item, dirs[i + 1] === item.path))}
                  {dir !== null && !sorted(dir).length && <p className="py-12 text-center text-sm text-muted-foreground">Empty folder</p>}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul ref={gridRef} className={cn('p-space', layout === 'cards' && 'grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-space-sm')}>
            {items.map(item => renderItem(item))}
          </ul>
        ))}
      </div>
      </Surface>

    </PageLayout>
  )
}
