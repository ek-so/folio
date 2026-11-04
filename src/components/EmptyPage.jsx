import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'

// Home and Graph: their title bar over an empty content box, until they get content.
export default function EmptyPage({ page }) {
  return (
    <PageLayout>
      <Surface tree title={<TitleBar tree page={page} />} />
    </PageLayout>
  )
}
