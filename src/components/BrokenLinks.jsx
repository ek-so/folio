import { CheckCircle } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import Header from './Header.jsx'
import FileIcon from './FileIcon.jsx'
import { displayName } from '../lib/files.js'
import { suggestFix } from '../lib/links.js'

// Every internal link that points at nothing, grouped by note. A link whose
// file exists under one other path gets a one-tap Fix.
export default function BrokenLinks({ broken, files, missing, onOpen, onFix, onBack }) {
  const groups = {}
  for (const b of broken) (groups[b.from] ||= []).push(b)
  const byNote = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title="Broken links" onBack={onBack} />
      <div className="flex-1 min-h-0 overflow-y-auto">
        {missing > 0 && (
          <p className="px-4 pt-3 text-xs text-muted-foreground">
            {missing} note{missing === 1 ? ' isn\'t' : 's aren\'t'} on this device yet, so {missing === 1 ? 'it isn\'t' : 'they aren\'t'} checked. Connect to the internet to include them.
          </p>
        )}
        {byNote.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <CheckCircle className="size-8" />
            <p className="text-sm">No broken links</p>
          </div>
        ) : byNote.map(([from, items]) => (
          <section key={from} className="border-b border-border px-4 py-3">
            <Button variant="ghost" className="-ml-3 gap-3 px-3 font-semibold" onClick={() => onOpen(from)}>
              <FileIcon path={from} />
              <span className="truncate">{displayName(from)}</span>
            </Button>
            <ul className="mt-1 flex flex-col gap-2">
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
                        Fix → {displayName(fix)}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
