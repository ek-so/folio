import { MagnifyingGlass } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import ItemMenu from './ItemMenu.jsx'
import PathBreadcrumbs from './PathBreadcrumbs.jsx'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'

// Screen for one open file (note, image or PDF): breadcrumbs, search and ⋯
// in the header, Sync and `actions` in the footer, the file's content in between.
export default function FilePage({ menu, path, root, name, changed, onNavigate, onRename, onDelete, onMove, folders, onSearch, syncButton, actions, children }) {
  return (
    <PageLayout>
      <Header
        // Phones: ← back to the folder holding the file; wider screens: ☰
        onBack={() => onNavigate(path.slice(0, Math.max(path.lastIndexOf('/'), 0)))}
        backMobileOnly
        start={<>
          <div className="hidden sm:flex">{menu}</div>
          <div className="ml-1 flex-1 min-w-0">
            <PathBreadcrumbs root={root} path={path} current={name} changed={changed} onNavigate={onNavigate} />
          </div>
        </>}
      >
        {syncButton}
        <Button variant="ghost-outline" size="icon" aria-label="Search" className="shrink-0 border-muted-foreground/50" onClick={onSearch}>
          <MagnifyingGlass />
        </Button>
        <ItemMenu item={{ name: path.split('/').pop(), path, type: 'file' }} onRename={onRename} onDelete={onDelete} onMove={onMove} folders={folders} />
      </Header>
      <Surface>{children}</Surface>
      {actions && <Footer>{actions}</Footer>}
    </PageLayout>
  )
}
