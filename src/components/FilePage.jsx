import ItemMenu from './ItemMenu.jsx'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import SymlinkedBy from './SymlinkedBy.jsx'
import TitleBar from './TitleBar.jsx'

// Screen for one open file (note, image or PDF):
// the content box: TitleBar (← and name) with ⋯ and
// `actions`, and the file's content.
export default function FilePage({ linkedBy, onOpenLink, path, name, changed, onRename, onDelete, onMove, folders, actions, children }) {
  return (
    <PageLayout>
      <Surface tree title={
        <TitleBar
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
