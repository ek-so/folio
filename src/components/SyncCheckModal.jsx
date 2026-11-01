import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'
import BrokenLinkList from './BrokenLinkList.jsx'

// Shown when Sync is tapped while the repo has broken links: fix them here,
// go to the Broken links page, or sync anyway.
export default function SyncCheckModal({ broken, files, onFix, onOpenNote, onOpenPage, onSyncAnyway, onClose }) {
  const n = broken.length
  return (
    <BottomSheet
      title={`${n} broken link${n === 1 ? '' : 's'}`}
      description="Fix them before syncing, or sync anyway."
      onClose={onClose}
    >
      <div className="-mx-6 max-h-72 overflow-y-auto border-y border-border" data-no-pull>
        <BrokenLinkList broken={broken} files={files} onOpen={onOpenNote} onFix={onFix} />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="secondary" onClick={onOpenPage}>Open Broken links</Button>
        <Button onClick={onSyncAnyway}>Sync anyway</Button>
      </div>
    </BottomSheet>
  )
}
