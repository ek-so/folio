import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'

// Confirms signing out: it removes the token and the offline copies from this
// device, and deletes any unsynced changes (`changeCount`).
export default function SignOutModal({ changeCount, onSignOut, onClose }) {
  return (
    <BottomSheet
      title="Sign out?"
      description={changeCount
        ? `You have ${changeCount} unsynced change${changeCount === 1 ? '' : 's'}. Signing out deletes them from this device.`
        : 'The offline copies of your notes are removed from this device, and you\'ll need your token to sign in again.'}
      onClose={onClose}
    >
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" onClick={onSignOut}>Sign out</Button>
      </div>
    </BottomSheet>
  )
}
