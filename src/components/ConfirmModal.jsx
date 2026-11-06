import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'

// The one confirmation for every destructive action (delete, discard, sign
// out, remove): `title`, `description`, Cancel and the red `confirm` button
// (default Remove) that calls `onConfirm`. `alternative`: { label, onSelect },
// a milder second way out (a column's "Move to No status").
export default function ConfirmModal({ title, description, confirm = 'Remove', onConfirm, alternative, onClose }) {
  return (
    <BottomSheet title={title} description={description} onClose={onClose}>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        {alternative && <Button variant="secondary" onClick={alternative.onSelect}>{alternative.label}</Button>}
        <Button variant="destructive" onClick={onConfirm}>{confirm}</Button>
      </div>
    </BottomSheet>
  )
}
