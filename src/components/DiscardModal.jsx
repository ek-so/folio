import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'

// Confirms dropping all local changes instead of syncing them.
export default function DiscardModal({ changeCount, onDiscard, onClose }) {
  return (
    <BottomSheet
      title={`Discard ${changeCount} change${changeCount === 1 ? '' : 's'}?`}
      description="They're deleted from this device and can't be recovered."
      onClose={onClose}
    >
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" onClick={onDiscard}>Discard</Button>
      </div>
    </BottomSheet>
  )
}
