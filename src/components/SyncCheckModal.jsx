import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'
import BrokenLinkList from './BrokenLinkList.jsx'
import { plural } from '../lib/plural.js'

// Shown when Sync is tapped while the repo has broken links: fix them here (BrokenLinkList's `actions`),
// go to the Broken links page, or sync anyway. Once none is left, the sync carries on (App).
export default function SyncCheckModal({ broken, files, actions, onOpenPage, onSyncAnyway, onClose }) {
  const n = broken.length
  return (
    <BottomSheet
      title={plural(n, 'broken link')}
      description="Fix them before syncing, or sync anyway."
      onClose={onClose}
      onOpenAutoFocus={e => e.preventDefault()} // nothing focused at first: no ring on the first note's name
    >
      <div className="flex max-h-72 flex-col gap-space-sm overflow-y-auto" data-no-pull>
        <BrokenLinkList broken={broken} files={files} actions={actions} />
      </div>
      <div className="flex flex-wrap justify-end gap-space-sm">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="secondary" onClick={onOpenPage}>Open Broken links</Button>
        <Button onClick={onSyncAnyway}>Sync anyway</Button>
      </div>
    </BottomSheet>
  )
}
