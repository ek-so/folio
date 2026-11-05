import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'

// Graph: its title bar over an empty content box, until it gets content
export default function EmptyPage({ page }) {
  return (
    <PageLayout>
      <Surface tree title={<TitleBar page={page} />} />
    </PageLayout>
  )
}
