import ConfirmModal from './ConfirmModal.jsx'
import { inArchive, KEEP_DAYS } from '../lib/archive.js'

// Removing a file, folder (with everything inside) or, with `kind`, something
// else by name (a view). The wording for ConfirmModal: a file or folder goes to the archive (lib/archive.js), one
// already there is removed for good.
export default function DeleteModal({ item, onDelete, onClose, kind: given }) {
  const isDir = item.type === 'dir' && !given
  const kind = given ?? (isDir ? 'folder' : item.name.endsWith('.md') ? 'note' : 'file')
  return (
    <ConfirmModal
      title={`Remove ${kind} “${item.name}”?`}
      description={given || inArchive(item.path)
        ? `${isDir ? 'Everything inside it will be removed too. ' : ''}It's removed from GitHub when you sync.`
        : `${isDir ? 'Everything inside goes with it. ' : ''}It moves to the archive, where you can recover it for ${KEEP_DAYS} days. Then it's removed for good.`}
      onConfirm={onDelete}
      onClose={onClose}
    />
  )
}
