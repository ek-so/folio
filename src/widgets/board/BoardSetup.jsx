import FolderSheet from '@/components/FolderSheet.jsx'
import { boardPath, serializeBoard, newBoard, withBoardKeys, DESCRIPTION } from './board.js'

// A new board: pick its folder. Its notes get a description, empty, if they lack one.
export default function BoardSetup({ services, onCreate, onClose }) {
  const { config, folders, remoteFiles, remoteText } = services
  return (
    <FolderSheet
      title="Board from folder…"
      folders={['', ...folders]}
      onPick={folder => {
        onCreate(id => ch => withBoardKeys(config.write(boardPath(id), serializeBoard(newBoard(folder)))(ch), remoteFiles, folder, [DESCRIPTION], remoteText))
        return null
      }}
      onClose={onClose}
    >
      <p className="text-muted-foreground text-xs">Its subfolders become the columns and their files the cards.</p>
    </FolderSheet>
  )
}
