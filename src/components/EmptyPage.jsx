import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import { PAGE } from '@/lib/pages.js'

// Home and Graph: their title bar over an empty content box, until they get content. Home is a dashboard: full width.
export default function EmptyPage({ page }) {
  return (
    <PageLayout>
      <Surface tree wide={page === PAGE.HOME} title={<TitleBar tree page={page} />} />
    </PageLayout>
  )
}
