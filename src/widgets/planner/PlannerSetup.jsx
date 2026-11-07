import FolderSheet from '@/components/FolderSheet.jsx'
import { plannerPath, serializePlanner, newPlanner, ORDER } from './planner.js'
import { editNotes } from '@/lib/folderNotes.js'
import { withKeys, withKeysFirst } from '@/lib/frontmatter.js'

// A new planner: pick its folder. Its notes get a description, date and repeat, empty, if they lack them, and have them on top in that order (ORDER).
export default function PlannerSetup({ services, onCreate, onClose }) {
  const { config, folders, remoteFiles, remoteText } = services
  return (
    <FolderSheet
      title="Planner from folder…"
      folders={['', ...folders]}
      onPick={folder => {
        onCreate(id => ch => editNotes(config.write(plannerPath(id), serializePlanner(newPlanner(folder)))(ch), remoteFiles, folder, t => withKeysFirst(withKeys(t, ORDER), ORDER), remoteText))
        return null
      }}
      onClose={onClose}
    >
      <p className="text-muted-foreground text-xs">Its notes become cards, each on the day of its date.</p>
    </FolderSheet>
  )
}
