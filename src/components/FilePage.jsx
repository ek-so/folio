import { MagnifyingGlass } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import Header from './Header.jsx'
import ItemMenu from './ItemMenu.jsx'
import PathBreadcrumbs from './PathBreadcrumbs.jsx'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import SymlinkedBy from './SymlinkedBy.jsx'
import TitleBar from './TitleBar.jsx'

// Screen for one open file (note, image or PDF): breadcrumbs, Search and Sync
// in the header; then the content box: TitleBar (`title`: its props) with ⋯
// and `actions`, and the file's content.
export default function FilePage({ menu, linkedBy, onOpenLink, path, root, name, changed, onNavigate, onRename, onDelete, onMove, folders, onSearch, syncButton, actions, title, children }) {
  return (
    <PageLayout>
      <Header
        // Phones: ← back to the folder holding the file; wider screens: ☰
        onBack={() => onNavigate(path.slice(0, Math.max(path.lastIndexOf('/'), 0)))}
        backMobileOnly
        start={<>
          <div className="hidden sm:flex">{menu}</div>
          <div className="ml-1 flex flex-1 min-w-0 items-center gap-1">
            {/* The breadcrumbs keep their room; the symlink names shrink first */}
            <div className="min-w-0 shrink-0 max-w-[70%]">
              <PathBreadcrumbs root={root} path={path} current={name} changed={changed} onNavigate={onNavigate} />
            </div>
            <SymlinkedBy links={linkedBy} onOpen={onOpenLink} />
          </div>
        </>}
      >
        <Button variant="ghost-outline" size="icon" aria-label="Search" className="shrink-0 border-muted-foreground/50" onClick={onSearch}>
          <MagnifyingGlass />
        </Button>
        {syncButton}
      </Header>
      <Surface title={
        <TitleBar path={path} {...title}>
          <ItemMenu item={{ name: path.split('/').pop(), path, type: 'file' }} onRename={onRename} onDelete={onDelete} onMove={onMove} folders={folders} />
          {actions}
        </TitleBar>
      }>
        {children}
      </Surface>
    </PageLayout>
  )
}
