import { MagnifyingGlass } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import Header from './Header.jsx'
import ItemMenu from './ItemMenu.jsx'
import PathBreadcrumbs from './PathBreadcrumbs.jsx'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import SymlinkedBy from './SymlinkedBy.jsx'
import TitleBar from './TitleBar.jsx'

// Screen for one open file (note, image or PDF): "Home", Search and Sync in
// the header; then the content box: TitleBar (breadcrumbs) with ⋯ and
// `actions`, and the file's content.
export default function FilePage({ menu, linkedBy, onOpenLink, path, root, name, changed, onNavigate, onRename, onDelete, onMove, folders, onSearch, syncButton, actions, children }) {
  return (
    <PageLayout>
      <Header title="Home" lead={menu}>
        <Button variant="ghost-outline" size="icon" aria-label="Search" className="shrink-0 border-muted-foreground/50" onClick={onSearch}>
          <MagnifyingGlass />
        </Button>
        {syncButton}
      </Header>
      <Surface title={
        <TitleBar
          path={path}
          crumbs={<PathBreadcrumbs root={root} path={path} current={name} changed={changed} onNavigate={onNavigate} />}
          badge={<SymlinkedBy links={linkedBy} onOpen={onOpenLink} />}
        >
          <ItemMenu item={{ name: path.split('/').pop(), path, type: 'file' }} onRename={onRename} onDelete={onDelete} onMove={onMove} folders={folders} />
          {actions}
        </TitleBar>
      }>
        {children}
      </Surface>
    </PageLayout>
  )
}
