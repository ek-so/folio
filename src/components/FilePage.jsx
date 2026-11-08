import { fileItem } from '../lib/folderNotes.js'
import ItemMenu from './ItemMenu.jsx'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import SymlinkedBy from './SymlinkedBy.jsx'
import TitleBar from './TitleBar.jsx'

// Screen for one open file (note, image or PDF):
// the content box: TitleBar (← and name) with ⋯ and
// `actions`, and the file's content. `lock`: ItemMenu's (a note's Lock / Unlock).
export default function FilePage({ linkedBy, onOpenLink, path, name, changed, onRename, onDuplicate, onDelete, onMove, folders, columns, lock, actions, children }) {
  return (
    <PageLayout>
      <Surface title={
        <TitleBar
          name={name}
          changed={changed}
          badge={<SymlinkedBy links={linkedBy} onOpen={onOpenLink} />}
        >
          <ItemMenu item={fileItem(path)} onRename={onRename} onDuplicate={onDuplicate} onDelete={onDelete} onMove={onMove} folders={folders} columns={columns} lock={lock} />
          {actions}
        </TitleBar>
      }>
        {children}
      </Surface>
    </PageLayout>
  )
}
