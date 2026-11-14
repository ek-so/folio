import { fileItem } from '../lib/folderNotes.js'
import ItemMenu from './ItemMenu.jsx'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import SymlinkedBy from './SymlinkedBy.jsx'
import TitleBar from './TitleBar.jsx'

// Screen for one open file (note, image or PDF):
// the content box: TitleBar (← and name) with ⋯ and
// `actions`, and the file's content. `extra`: what only this page's ⋯ offers (ItemMenu's; a board card's Move to column).
export default function FilePage({ linkedBy, onOpenLink, path, name, changed, extra, actions, children }) {
  return (
    <PageLayout>
      <Surface title={
        <TitleBar
          name={name}
          changed={changed}
          badge={linkedBy?.length ? <SymlinkedBy links={linkedBy} onOpen={onOpenLink} /> : null}
        >
          <ItemMenu item={fileItem(path)} extra={extra} />
          {actions}
        </TitleBar>
      }>
        {children}
      </Surface>
    </PageLayout>
  )
}
