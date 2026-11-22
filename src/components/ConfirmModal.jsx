import { Button } from './ui/button.jsx'
import BottomSheet, { SheetActions } from './BottomSheet.jsx'

// The one confirmation for every destructive action (delete, discard, sign
// out, remove): `title`, `description`, Cancel and the red `confirm` button
// (default Remove) that calls `onConfirm`. `alternative`: { label, onSelect },
// a milder second way out (a column's "Move to No status"). `safe`: an action
// that can be taken back (Recent updates' Undo), with the accent button instead of the red one.
export default function ConfirmModal({ title, description, confirm = 'Remove', onConfirm, alternative, safe, onClose }) {
  return (
    <BottomSheet title={title} description={description} onClose={onClose}>
      <SheetActions className="flex-wrap">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        {alternative && <Button variant="secondary" onClick={alternative.onSelect}>{alternative.label}</Button>}
        <Button variant={safe ? 'default' : 'destructive'} onClick={onConfirm}>{confirm}</Button>
      </SheetActions>
    </BottomSheet>
  )
}
