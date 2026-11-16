import { useState } from 'react'
import { Wrench, CursorText, LinkSimple, FilePlus, Trash } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenuItem } from './ui/dropdown-menu.jsx'
import MoreMenu from './MoreMenu.jsx'
import FileIcon from './FileIcon.jsx'
import SearchSheet from './SearchSheet.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import { displayName } from '../lib/files.js'
import { suggestFix, fixCandidates, missingNotePath, hidden } from '../lib/links.js'

// Broken links grouped by note: the note (tap to open), then each link's text, target and the line it's on, and a ⋯
// with every fix, so the row keeps its width: Fix: link to name (when one file in the repo has the missing name, first),
// Open at link (the note in the editor, the link selected), Choose file… (any file, same-name ones first), Create note (where the link points, for a link to a
// note), Remove link (its text stays; confirmed). Used on the Broken links page and in the check before Sync.
// `actions`: { open(path), openAt(b), fix(b, path), create(b), unlink(b) }.
export default function BrokenLinkList({ broken, files, actions }) {
  const [choosing, setChoosing] = useState(null) // the broken link Choose file… is for
  const [unlinking, setUnlinking] = useState(null) // the broken link Remove link is confirming
  const groups = {}
  for (const b of broken) (groups[b.from] ||= []).push(b)
  const byNote = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  const label = b => b.link.text || b.link.target
  const candidates = choosing && fixCandidates(choosing.link, choosing.from, files) // none: Choose file… lists every file

  return <>
    {byNote.map(([from, items]) => (
      <section key={from} className="border-b border-border px-space py-3 last:border-b-0">
        <Button variant="ghost" className="-ml-3 gap-3 px-3 font-semibold" onClick={() => actions.open(from)}>
          <FileIcon path={from} />
          <span className="truncate">{displayName(from)}</span>
        </Button>
        <ul className="mt-space-xs flex flex-col gap-space-sm">
          {items.map((b, i) => {
            const fix = suggestFix(b.link, files)
            const newNote = missingNotePath(from, b.link)
            return (
              <li key={i} className="flex items-center gap-space-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{label(b)}</span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">{b.link.target}</span>
                  {b.line && <span className="block truncate text-xs text-muted-foreground">{b.line}</span>}
                </span>
                <MoreMenu
                  label="Link actions" className="shrink-0"
                  sections={[
                    fix && <DropdownMenuItem onSelect={() => actions.fix(b, fix)}><Wrench /> Fix: link to {displayName(fix)}</DropdownMenuItem>,
                    <>
                      <DropdownMenuItem onSelect={() => actions.openAt(b)}><CursorText /> Open at link</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setChoosing(b)}><LinkSimple /> Choose file…</DropdownMenuItem>
                      {newNote && <DropdownMenuItem onSelect={() => actions.create(b)}><FilePlus /> Create {displayName(newNote)}</DropdownMenuItem>}
                    </>,
                    <DropdownMenuItem variant="destructive" onSelect={() => setUnlinking(b)}><Trash /> Remove link</DropdownMenuItem>,
                  ]}
                />
              </li>
            )
          })}
        </ul>
      </section>
    ))}

    {choosing && (
      <SearchSheet
        title={`Link “${label(choosing)}” to…`}
        virtual={files}
        recent={candidates.length ? candidates : undefined}
        only={p => p !== choosing.from && !hidden(p)}
        onSelect={path => actions.fix(choosing, path)}
        onClose={() => setChoosing(null)}
      />
    )}

    {unlinking && (
      <ConfirmModal
        title="Remove link?"
        description={`“${label(unlinking)}” stays in ${displayName(unlinking.from)} as plain text.`}
        onConfirm={() => { actions.unlink(unlinking); setUnlinking(null) }}
        onClose={() => setUnlinking(null)}
      />
    )}
  </>
}
