import PageLayout from './PageLayout.jsx'
import Header from './Header.jsx'
import Surface from './Surface.jsx'

// Home and Graph: header like the file screens (☰, title, Search, Sync) over
// an empty content box, until they get content.
export default function EmptyPage({ title, menu, onSearch, syncButton }) {
  return (
    <PageLayout>
      <Header title={title} lead={menu} onSearch={onSearch} syncButton={syncButton} />
      <Surface />
    </PageLayout>
  )
}
