import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import { PAGE } from '@/lib/pages.js'

// A view (Home…) or Graph: its title bar over an empty content box, until it gets content. A view is a dashboard: full width.
export default function EmptyPage({ page }) {
  return (
    <PageLayout>
      <Surface tree wide={page !== PAGE.GRAPH} title={<TitleBar page={page} />} />
    </PageLayout>
  )
}
