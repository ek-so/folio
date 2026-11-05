import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'

// Deleting a board's column (its folder): with `count` cards, ask whether they
// go with it or move to No status (`onDelete(keepCards)`); an empty one is just confirmed
export default function ColumnDeleteModal({ name, count, onDelete, onClose }) {
  return (
    <BottomSheet
      title={`Delete column “${name}”?`}
      description={count
        ? `It has ${count} card${count === 1 ? '' : 's'}. Delete them too, or move them to No status? It's removed from GitHub when you sync.`
        : 'Its folder is removed from GitHub when you sync.'}
      onClose={onClose}
    >
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        {count > 0 && <Button variant="secondary" onClick={() => onDelete(true)}>Move to No status</Button>}
        <Button variant="destructive" onClick={() => onDelete(false)}>{count ? 'Delete with cards' : 'Delete'}</Button>
      </div>
    </BottomSheet>
  )
}
