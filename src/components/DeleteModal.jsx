import ConfirmModal from './ConfirmModal.jsx'

// Deleting a file, folder (with everything inside) or, with `kind`, something
// else by name (a view). The wording for ConfirmModal.
export default function DeleteModal({ item, onDelete, onClose, kind: given }) {
  const isDir = item.type === 'dir' && !given
  const kind = given ?? (isDir ? 'folder' : item.name.endsWith('.md') ? 'note' : 'file')
  return (
    <ConfirmModal
      title={`Delete ${kind} “${item.name}”?`}
      description={`${isDir ? 'Everything inside it will be deleted too. ' : ''}It's removed from GitHub when you sync.`}
      onConfirm={onDelete}
      onClose={onClose}
    />
  )
}
