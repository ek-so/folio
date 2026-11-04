import { CheckCircle } from '@phosphor-icons/react'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import { PAGE } from '../lib/pages.js'
import BrokenLinkList from './BrokenLinkList.jsx'

// Page listing every internal link that points at nothing (BrokenLinkList).
export default function BrokenLinks({ broken, files, missing, onOpen, onFix }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Surface title={<TitleBar page={PAGE.LINKS} />}>
      <div className="flex-1 min-h-0 overflow-y-auto max-md:pb-nav">
        {missing > 0 && (
          <p className="px-4 pt-3 text-xs text-muted-foreground">
            {missing} note{missing === 1 ? ' isn\'t' : 's aren\'t'} on this device yet, so {missing === 1 ? 'it isn\'t' : 'they aren\'t'} checked. Connect to the internet to include them.
          </p>
        )}
        {broken.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <CheckCircle className="size-8" />
            <p className="text-sm">No broken links</p>
          </div>
        ) : (
          <BrokenLinkList broken={broken} files={files} onOpen={onOpen} onFix={onFix} />
        )}
      </div>
      </Surface>
    </div>
  )
}
