import { CalendarDots } from '@phosphor-icons/react'
import Planner from './Planner.jsx'
import PlannerSetup from './PlannerSetup.jsx'
import { BADGES } from './RecurrenceField.jsx'
import { plannerPath, plannerTitle, parsePlanner, serializePlanner, movedPlanner, FIXED, ORDER } from './planner.js'
import { isTechnical } from '@/lib/folderNotes.js'
import { displayName } from '@/lib/files.js'

// The planner widget: see planner.js. Its settings are .folio/planners/<id>.json.
export default {
  type: 'planner',
  label: 'Planner',
  icon: CalendarDots,
  Widget: Planner,
  Setup: PlannerSetup,
  title(id, { config, repoName }) {
    const file = config.read(plannerPath(id))
    const planner = file.ready && file.text !== undefined ? parsePlanner(file.text) : null
    return planner ? plannerTitle(planner, repoName) : 'Planner'
  },
  // Its notes, by name
  tree(id, services) {
    const file = services.config.read(plannerPath(id))
    const planner = file.ready && file.text !== undefined ? parsePlanner(file.text) : null
    if (!planner) return []
    const prefix = planner.folder ? planner.folder + '/' : ''
    return services.files
      .filter(p => p.startsWith(prefix) && p.toLowerCase().endsWith('.md') && !isTechnical(p.slice(prefix.length)))
      .map(p => ({ key: p, name: displayName(p), path: p }))
      .sort((a, b) => a.name.localeCompare(b.name))
  },
  // Its folder follows renames and moves
  moved(ch, id, from, to, isDir, { config }) {
    const text = config.readIn(ch, plannerPath(id))
    const planner = typeof text === 'string' ? parsePlanner(text) : null
    if (!planner) return ch
    const moved = serializePlanner(movedPlanner(planner, from, to, isDir))
    return moved === serializePlanner(planner) ? ch : config.write(plannerPath(id), moved)(ch)
  },
  // Where a note's property values come from on its page when it's a card of this planner: the whole planner
  // ({ name, includes(path) }), so a value used on one day is offered on every other; its date and repeat come back
  // when it's saved without them (`required`), come first and can't be edited in its markdown (`locked`: their badges
  // change them), its properties come in ORDER on its page and in its file when they come back (`order`), and its repeat
  // shows as RecurrenceField (`badges`); else null
  valueScope(id, path, services) {
    const file = services.config.read(plannerPath(id))
    const planner = file.ready && file.text !== undefined ? parsePlanner(file.text) : null
    const prefix = planner?.folder ? planner.folder + '/' : ''
    const inPlanner = p => p.startsWith(prefix) && !isTechnical(p.slice(prefix.length))
    return planner && inPlanner(path) ? { name: 'this planner', includes: inPlanner, required: FIXED, locked: FIXED, order: ORDER, badges: BADGES } : null
  },
  removed: (ch, id, { config }) => config.erase(plannerPath(id))(ch),
}
