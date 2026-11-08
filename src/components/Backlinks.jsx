import { ListRow } from './ui/list-row.jsx'
import FileIcon from './FileIcon.jsx'
import { displayName } from '../lib/files.js'

// "Linked from": notes that link to the open note, each with the line the
// link is on. Hidden when nothing links here.
export default function Backlinks({ links, onOpen }) {
  if (!links?.length) return null
  return (
    <section className="mx-5 mb-space-lg mt-space-sm border-t border-border pt-space">
      <h2 className="mb-space-sm text-sm font-semibold text-muted-foreground">Linked from</h2>
      <ul className="-mx-3 flex flex-col">
        {links.map(({ from, line }, i) => (
          <li key={`${from}:${i}`}>
            <ListRow icon={<FileIcon path={from} />} title={displayName(from)} description={line} onClick={() => onOpen(from)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
