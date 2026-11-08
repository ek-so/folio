import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'
import BrokenLinkList from './BrokenLinkList.jsx'
import { plural } from '../lib/plural.js'

// Shown when Sync is tapped while the repo has broken links: fix them here,
// go to the Broken links page, or sync anyway.
export default function SyncCheckModal({ broken, files, onFix, onOpenNote, onOpenPage, onSyncAnyway, onClose }) {
  const n = broken.length
  return (
    <BottomSheet
      title={plural(n, 'broken link')}
      description="Fix them before syncing, or sync anyway."
      onClose={onClose}
    >
      <div className="-mx-space-lg max-h-72 overflow-y-auto border-y border-border" data-no-pull>
        <BrokenLinkList broken={broken} files={files} onOpen={onOpenNote} onFix={onFix} />
      </div>
      <div className="flex flex-wrap justify-end gap-space-sm">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="secondary" onClick={onOpenPage}>Open Broken links</Button>
        <Button onClick={onSyncAnyway}>Sync anyway</Button>
      </div>
    </BottomSheet>
  )
}
