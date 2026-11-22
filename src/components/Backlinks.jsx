import { ListRow } from './ui/list-row.jsx'
import FileIcon from './FileIcon.jsx'
import { displayName } from '../lib/files.js'

// "Linked from": notes that link to the open note, each once (a note linking here twice is one row) with the line its
// first link is on. Hidden when nothing links here.
export default function Backlinks({ links, onOpen }) {
  if (!links?.length) return null
  const notes = links.filter((l, i) => links.findIndex(x => x.from === l.from) === i)
  return (
    <section className="mx-5 mb-space-lg mt-space-sm border-t border-border pt-space">
      <h2 className="mb-space-sm text-sm font-semibold text-muted-foreground">Linked from</h2>
      <ul className="-mx-3 flex flex-col">
        {notes.map(({ from, line }) => (
          <li key={from}>
            <ListRow icon={<FileIcon path={from} />} title={displayName(from)} description={line} onClick={() => onOpen(from)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
