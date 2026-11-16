import { useState } from 'react'
import { Wrench, LinkBreak, LinkSimple, FilePlus, Trash } from '@phosphor-icons/react'
import { ListRow } from './ui/list-row.jsx'
import { DropdownMenuItem } from './ui/dropdown-menu.jsx'
import MoreMenu from './MoreMenu.jsx'
import FileIcon from './FileIcon.jsx'
import HeaderBox from './HeaderBox.jsx'
import MiddleCut from './MiddleCut.jsx'
import SearchSheet from './SearchSheet.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import { displayName } from '../lib/files.js'
import { plural } from '../lib/plural.js'
import { suggestFix, fixCandidates, missingNotePath, hidden } from '../lib/links.js'

// Broken links grouped by note, each note a HeaderBox (as an update is in Recent updates): the note's name and its
// count on top (tap the name to open it), then a ListRow per link: its text, its target as the description (cut in the middle, so its end shows), the line
// it's on as the tooltip; a tap opens the note in the editor with the link selected. Its ⋯ holds every fix: Fix: link to
// name (first, when one file in the repo has the missing name), Choose file… (any file, same-name ones first), Create
// name (a note where the link points, for a link to a note), Remove link (its text stays; confirmed). Used on the
// Broken links page and in the check before Sync.
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
      <HeaderBox key={from} icon={<FileIcon path={from} />} title={displayName(from)} meta={plural(items.length, 'broken link')} onOpen={() => actions.open(from)}>
        <ul className="flex flex-col gap-0.5">
          {items.map((b, i) => {
            const fix = suggestFix(b.link, files)
            const newNote = missingNotePath(from, b.link)
            return (
              <li key={i}>
                <ListRow
                  icon={<LinkBreak className="text-muted-foreground" />} title={label(b)} description={<MiddleCut text={b.link.target} />}
                  tooltip={b.line} onClick={() => actions.openAt(b)}
                  trailing={
                    <MoreMenu
                      label="Link actions" inRow reveal
                      sections={[
                        fix && <DropdownMenuItem onSelect={() => actions.fix(b, fix)}><Wrench /> Fix: link to {displayName(fix)}</DropdownMenuItem>,
                        <>
                          <DropdownMenuItem onSelect={() => setChoosing(b)}><LinkSimple /> Choose file…</DropdownMenuItem>
                          {newNote && <DropdownMenuItem onSelect={() => actions.create(b)}><FilePlus /> Create {displayName(newNote)}</DropdownMenuItem>}
                        </>,
                        <DropdownMenuItem variant="destructive" onSelect={() => setUnlinking(b)}><Trash /> Remove link</DropdownMenuItem>,
                      ]}
                    />
                  }
                />
              </li>
            )
          })}
        </ul>
      </HeaderBox>
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
