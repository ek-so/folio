import FolderSheet from '@/components/FolderSheet.jsx'
import { plannerPath, serializePlanner, newPlanner, FIXED } from './planner.js'
import { withNoteKeys } from '@/lib/folderNotes.js'
import { DESCRIPTION } from '@/lib/frontmatter.js'

// A new planner: pick its folder. Its notes get a date and a description, empty, if they lack them.
export default function PlannerSetup({ services, onCreate, onClose }) {
  const { config, folders, remoteFiles, remoteText } = services
  return (
    <FolderSheet
      title="Planner from folder…"
      folders={['', ...folders]}
      onPick={folder => {
        onCreate(id => ch => withNoteKeys(config.write(plannerPath(id), serializePlanner(newPlanner(folder)))(ch), remoteFiles, folder, [...FIXED, DESCRIPTION], remoteText))
        return null
      }}
      onClose={onClose}
    >
      <p className="text-muted-foreground text-xs">Its notes become cards, each on the day of its date.</p>
    </FolderSheet>
  )
}
