import { useContext } from 'react'
import FolderSheet from './FolderSheet.jsx'
import { LinksContext } from '../hooks/useLinkIndex.js'
import { canMoveTo } from '../lib/changes.js'

export default function MoveModal({ item, folders, onMove, onClose }) {
  const linkedFrom = useContext(LinksContext)?.linkedFrom(item) ?? 0
  return (
    <FolderSheet
      title={`Move "${item.name}" to…`}
      folders={['', ...folders].filter(f => canMoveTo(item, f))}
      onPick={folder => onMove(item, folder)}
      onClose={onClose}
    >
      {linkedFrom > 0 && (
        <p className="text-muted-foreground text-xs">
          {linkedFrom} note{linkedFrom === 1 ? ' links' : 's link'} here; {linkedFrom === 1 ? 'its link' : 'their links'} will be updated.
        </p>
      )}
    </FolderSheet>
  )
}
