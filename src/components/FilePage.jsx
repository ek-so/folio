import Header from './Header.jsx'
import ItemMenu from './ItemMenu.jsx'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import SymlinkedBy from './SymlinkedBy.jsx'
import TitleBar from './TitleBar.jsx'

// Screen for one open file (note, image or PDF): "File manager", Search and Sync in
// the header; then the content box: TitleBar (icon and name) with ⋯ and
// `actions`, and the file's content.
export default function FilePage({ menu, title, linkedBy, onOpenLink, path, name, changed, onRename, onDelete, onMove, folders, onSearch, syncButton, actions, children }) {
  return (
    <PageLayout>
      <Header title={title} lead={menu} onSearch={onSearch} syncButton={syncButton} />
      <Surface tree title={
        <TitleBar
          path={path}
          name={name}
          changed={changed}
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
