import FolderSheet from '@/components/FolderSheet.jsx'
import { boardPath, serializeBoard, newBoard, STATUS } from './board.js'
import { withNoteKeys } from '@/lib/folderNotes.js'
import { DESCRIPTION } from '@/lib/frontmatter.js'

// A new board: pick its folder. The notes right in it get a status and a description, empty, if they lack them.
export default function BoardSetup({ services, onCreate, onClose }) {
  const { config, folders, remoteFiles, remoteText } = services
  return (
    <FolderSheet
      title="Board from folder…"
      folders={['', ...folders]}
      onPick={folder => {
        onCreate(id => ch => withNoteKeys(config.write(boardPath(id), serializeBoard(newBoard(folder)))(ch), remoteFiles, folder, [STATUS, DESCRIPTION], remoteText, true))
        return null
      }}
      onClose={onClose}
    >
      <p className="text-muted-foreground text-xs">The files right in it become the cards, in a column per status. Its subfolders stay off the board.</p>
    </FolderSheet>
  )
}
