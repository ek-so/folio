import { EmptyMessage, EMPTY } from './EmptyState.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import { PAGE } from '../lib/pages.js'
import BrokenLinkList from './BrokenLinkList.jsx'
import PageLayout from './PageLayout.jsx'

// Page listing every internal link that points at nothing (BrokenLinkList).
export default function BrokenLinks({ broken, files, missing, actions }) {
  return (
    <PageLayout>
      <Surface title={<TitleBar page={PAGE.LINKS} />}>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {missing > 0 && (
          <p className="px-space pt-3 text-xs text-muted-foreground">
            {missing} note{missing === 1 ? ' isn\'t' : 's aren\'t'} on this device yet, so {missing === 1 ? 'it isn\'t' : 'they aren\'t'} checked. Connect to the internet to include them.
          </p>
        )}
        {broken.length === 0 ? (
          <EmptyMessage size="lg" emoji={EMPTY.links}>No broken links</EmptyMessage>
        ) : (
          <div className="flex flex-col gap-space p-space">
            <BrokenLinkList broken={broken} files={files} actions={actions} />
          </div>
        )}
      </div>
      </Surface>
    </PageLayout>
  )
}
