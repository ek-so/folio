import { ArrowRight } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import FileIcon from './FileIcon.jsx'
import { displayName } from '../lib/files.js'
import { suggestFix } from '../lib/links.js'

// Broken links grouped by note: the note (tap to open), then each link's text
// and target, with Fix → name when one file in the repo has the missing name.
// Used on the Broken links page and in the check before Sync.
export default function BrokenLinkList({ broken, files, onOpen, onFix }) {
  const groups = {}
  for (const b of broken) (groups[b.from] ||= []).push(b)
  const byNote = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))

  return byNote.map(([from, items]) => (
    <section key={from} className="border-b border-border px-space py-3 last:border-b-0">
      <Button variant="ghost" className="-ml-3 gap-3 px-3 font-semibold" onClick={() => onOpen(from)}>
        <FileIcon path={from} />
        <span className="truncate">{displayName(from)}</span>
      </Button>
      <ul className="mt-space-xs flex flex-col gap-space-sm">
        {items.map((b, i) => {
          const fix = suggestFix(b.link, files)
          return (
            <li key={i} className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{b.link.text ?? b.link.target}</span>
                <span className="block truncate font-mono text-xs text-muted-foreground">{b.link.target}</span>
              </span>
              {fix && (
                <Button variant="secondary" className="shrink-0" onClick={() => onFix(b, fix)}>
                  Fix <ArrowRight /> {displayName(fix)}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  ))
}
