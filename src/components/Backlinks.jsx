import { Button } from './ui/button.jsx'
import FileIcon from './FileIcon.jsx'
import { displayName } from '../lib/files.js'

// "Linked from": notes that link to the open note, each with the line the
// link is on. Hidden when nothing links here.
export default function Backlinks({ links, onOpen }) {
  if (!links?.length) return null
  return (
    <section className="mx-5 mb-6 mt-2 border-t border-border pt-4">
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Linked from</h2>
      <ul className="-mx-3 flex flex-col">
        {links.map(({ from, line }, i) => (
          <li key={`${from}:${i}`}>
            <Button
              variant="ghost"
              className="h-auto min-h-8 w-full justify-start gap-3 px-3 py-1 font-normal text-left"
              onClick={() => onOpen(from)}
            >
              <FileIcon path={from} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{displayName(from)}</span>
                <span className="block truncate text-xs text-muted-foreground">{line}</span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
