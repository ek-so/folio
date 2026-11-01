import { useState, useRef, useEffect } from 'react'
import { Plus, FileText, Folder, MagnifyingGlass } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import PathBreadcrumbs from './PathBreadcrumbs.jsx'
import ItemMenu from './ItemMenu.jsx'
import { splitName } from '../lib/changes.js'
import { fileKind } from '../lib/files.js'
import FileIcon from './FileIcon.jsx'
import { cache } from '../lib/cache.js'

// Returns the leading emoji from a markdown file's first H1, or null.
function extractLeadingEmoji(text) {
  const m = /^# /m.exec(text)
  if (!m) return null
  const after = text.slice(m.index + 2)
  const first = [...after][0]
  if (!first) return null
  return first.codePointAt(0) > 0x2500 ? first : null
}

function useFileEmojis(items) {
  const [emojis, setEmojis] = useState({})
  const shaKey = items.map(i => i.type === 'file' ? (i.sha ?? '') : '').join('|')
  useEffect(() => {
    let cancelled = false
    const mdItems = items.filter(i => i.type === 'file' && i.path.endsWith('.md') && i.sha)
    if (!mdItems.length) return
    ;(async () => {
      const updates = {}
      for (const item of mdItems) {
        const b64 = await cache.getBlob(item.sha)
        if (cancelled || b64 === undefined) continue
        try {
          const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
          updates[item.path] = extractLeadingEmoji(new TextDecoder().decode(bytes))
        } catch { /* skip */ }
      }
      if (!cancelled) setEmojis(updates)
    })()
    return () => { cancelled = true }
  }, [shaKey]) // eslint-disable-line react-hooks/exhaustive-deps
  return emojis
}
import Spinner from './Spinner.jsx'
import PageLayout from './PageLayout.jsx'
import { cn } from '@/lib/utils.js'

export default function FileBrowser({ path, onNavigate, listDir, loading, error, notice, onSelect, onNewFile, repoName, onRename, onDelete, onMove, folders, menu, syncButton, onSearch }) {
  const items = loading ? [] : listDir(path)
  const emojis = useFileEmojis(items)
  const draggingRef = useRef(null) // always current for event handlers
  const [dragging, setDragging] = useState(null) // for rendering only
  const [dragOverPath, setDragOverPath] = useState(null)

  function navigate(item) {
    if (item.type === 'dir') onNavigate(item.path)
    else onSelect(item.path)
  }

  const currentFolder = path ? path.split('/').pop() : repoName

  return (
    <PageLayout>
      <Header
        start={
          path ? (
            <div className="flex-1 min-w-0">
              <PathBreadcrumbs root={repoName} path={path} onNavigate={onNavigate} />
            </div>
          ) : menu
        }
      >
        <Button variant="ghost-outline" size="icon" aria-label="Search" className="shrink-0 border-muted-foreground/50" onClick={onSearch}>
          <MagnifyingGlass />
        </Button>
        {path && (
          <ItemMenu item={{ name: currentFolder, path, type: 'dir' }} onRename={onRename} onDelete={onDelete} onMove={onMove} folders={folders} />
        )}
      </Header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-[1000px] mx-auto">
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
          <ul className="py-2 px-2">
            {items.map(item => {
              const [base, ext] = item.type === 'dir' ? [item.name, ''] : splitName(item.name)
              const openable = item.type === 'dir' || fileKind(item.path) !== 'file'
              const isDraggedItem = dragging?.path === item.path
              return (
                <li
                  key={item.path}
                  draggable
                  onDragStart={e => {
                    draggingRef.current = item
                    setDragging(item)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => {
                    draggingRef.current = null
                    setDragging(null)
                    setDragOverPath(null)
                  }}
                  className={isDraggedItem ? 'opacity-40' : ''}
                >
                  <div
                    className={cn(
                      'flex items-center pr-1 rounded-lg transition-colors',
                      dragOverPath === item.path && item.type === 'dir' && 'bg-primary/10 ring-1 ring-primary/40'
                    )}
                    onDragOver={e => {
                      const d = draggingRef.current
                      if (item.type !== 'dir' || !d || d.path === item.path) return
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setDragOverPath(item.path)
                    }}
                    onDragLeave={e => {
                      if (item.type !== 'dir') return
                      if (!e.currentTarget.contains(e.relatedTarget)) setDragOverPath(null)
                    }}
                    onDrop={e => {
                      const d = draggingRef.current
                      if (item.type !== 'dir' || !d || d.path === item.path) return
                      e.preventDefault()
                      onMove?.(d, item.path)
                      draggingRef.current = null
                      setDragging(null)
                      setDragOverPath(null)
                    }}
                  >
                    <Button
                      variant="ghost"
                      className="flex-1 min-w-0 justify-start gap-3 pl-3 pr-0 rounded-lg font-normal text-left hover:bg-secondary disabled:opacity-100 disabled:cursor-default"
                      onClick={() => navigate(item)}
                      disabled={!openable}
                    >
                      <FileIcon path={item.path} dir={item.type === 'dir'} emoji={emojis[item.path]} />
                      <span className="flex-1 text-base truncate">
                        {base}
                        {ext && <span className="text-muted-foreground">{ext}</span>}
                        {item.changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
                      </span>
                    </Button>
                    <ItemMenu item={item} onRename={onRename} onDelete={onDelete} onMove={onMove} folders={folders} inList />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        </div>
      </div>

      <Footer>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" aria-label="New" className="shrink-0">
              <Plus />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
            <DropdownMenuItem onSelect={() => onNewFile(path, 'note')}><FileText /> New note</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onNewFile(path, 'folder')}><Folder /> New folder</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {syncButton}
      </Footer>
    </PageLayout>
  )
}
