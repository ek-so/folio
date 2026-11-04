import { useState, useRef } from 'react'
import { Plus, FileText, Folder, UploadSimple } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import ItemMenu from './ItemMenu.jsx'
import { ListRow } from './ui/list-row.jsx'
import { splitName } from '../lib/changes.js'
import { fileKind, LINK_ERRORS } from '../lib/files.js'
import FileIcon from './FileIcon.jsx'
import SymlinkedBy from './SymlinkedBy.jsx'
import Spinner from './Spinner.jsx'
import PageLayout from './PageLayout.jsx'
import { cn } from '@/lib/utils.js'

export default function FileBrowser({ path, onNavigate, listDir, loading, error, notice, onSelect, onNewFile, repoName, onRename, onDelete, onMove, folders, onUpload, onDropMove, symlinks = {}, linkedBy, onOpenLink }) {
  // Symlinked folders sort with the folders
  const isFolder = i => i.type === 'dir' || symlinks[i.path]?.kind === 'folder'
  const listed = loading ? [] : listDir(path)
  const items = [...listed.filter(isFolder), ...listed.filter(i => !isFolder(i))]
  const draggingRef = useRef(null) // always current for event handlers
  const [dragging, setDragging] = useState(null) // for rendering only
  const [dragOverPath, setDragOverPath] = useState(null)
  const [filesOver, setFilesOver] = useState(false) // files from the device dragged over the list
  const pickerRef = useRef()

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

  return (
    <PageLayout>
      <Surface tree title={
        <TitleBar
          name={path ? currentFolder : repoName}
          badge={<SymlinkedBy links={linkedBy} onOpen={onOpenLink} />}
        >
          {path && <ItemMenu item={{ name: currentFolder, path, type: 'dir' }} onRename={onRename} onDelete={onDelete} onMove={onMove} folders={folders} />}
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
        {error && <p className="text-destructive text-sm text-center pt-4 px-4">{error}</p>}
        {notice && <p className="text-muted-foreground text-xs text-center pt-3 px-4">{notice}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-12">No notes yet</p>
        )}
        {!loading && (
          <ul className="p-space">
            {items.map(item => {
              const [base, ext] = item.type === 'dir' ? [item.name, ''] : splitName(item.name)
              const isLink = item.path in symlinks
              const link = symlinks[item.path] // undefined while loading
              const openable = isLink ? !!link?.kind : item.type === 'dir' || fileKind(item.path) !== 'file'
              const isDraggedItem = dragging?.path === item.path
              return (
                <li key={item.path}>
                  <ListRow
                    icon={isLink
                      ? <FileIcon path={link?.path ?? item.path} dir={link?.kind === 'folder'} link />
                      : <FileIcon path={item.path} dir={item.type === 'dir'} />}
                    title={<>
                      {base}
                      {ext && <span className="text-muted-foreground">{ext}</span>}
                      {isLink && <span className="text-muted-foreground"> (symlink)</span>}
                      {link?.error && <span className="ml-2 text-sm text-muted-foreground">{LINK_ERRORS[link.error]}</span>}
                    </>}
                    changed={item.changed}
                    onClick={() => navigate(item)}
                    disabled={!openable}
                    // Hidden files and links fade their icon and name only, not the row's hover or ⋯
                    dimmed={!isDraggedItem && (item.name.startsWith('.') || isLink)}
                    // Where a link points: the browser's own tooltip on hover
                    tooltip={link?.path ? `Symlinked from ${link.path}` : undefined}
                    trailing={<ItemMenu item={item} onRename={onRename} onDelete={onDelete} onMove={onMove} folders={folders} inList />}
                    className={cn(
                      isDraggedItem && 'opacity-40',
                      dragOverPath === item.path && item.type === 'dir' && 'bg-primary/10 ring-1 ring-primary/40',
                    )}
                    rowProps={{
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
                    }}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
      </Surface>

    </PageLayout>
  )
}
