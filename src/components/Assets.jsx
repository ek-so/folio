import { Images, ArrowSquareOut } from '@phosphor-icons/react'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import PageLayout from './PageLayout.jsx'
import FileIcon from './FileIcon.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import { PAGE } from '../lib/pages.js'
import { assetList } from '../lib/assets.js'
import { plural } from '../lib/plural.js'
import { displayName } from '../lib/files.js'

// Page listing every file in the repo that isn't a note (images, PDFs, uploads: lib/assets.js), newest added first, each
// as a row (ListRow): its name and under it its path; a row opens the file. On the right, a button opens the note that
// uses it (`backlinks`, the link index's: the notes that link to it): one opens at once, several list in a menu, none
// shows no button.
export default function Assets({ files, added, backlinks, onOpen }) {
  const paths = assetList(Object.keys(files), added)
  return (
    <PageLayout>
      <Surface title={<TitleBar page={PAGE.ASSETS} />}>
        <div className="flex-1 min-h-0 overflow-y-auto" data-no-pull>
          {paths.length === 0 ? (
            <div className="flex flex-col items-center gap-space-sm py-12 text-muted-foreground">
              <Images className="size-8" />
              <p className="text-sm">No files yet. Images, PDFs and other uploads show here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-space-sm p-space">
              <p className="px-3 text-sm text-muted-foreground">{plural(paths.length, 'file')}</p>
              <ul className="flex flex-col gap-0.5">
                {paths.map(path => (
                  <li key={path}>
                    <ListRow icon={<FileIcon path={path} />} title={path.split('/').pop()} description={path} onClick={() => onOpen(path)} trailing={<UsedIn notes={[...new Set((backlinks[path] ?? []).map(l => l.from))]} onOpen={onOpen} />} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Surface>
    </PageLayout>
  )
}

// The button that opens the note an asset is used in (a menu of them when it's in several), quiet and medium inside its row
function UsedIn({ notes, onOpen }) {
  if (!notes.length) return null
  if (notes.length === 1) {
    return (
      <Button variant="ghost-quiet" size="icon-md" aria-label={`Open ${displayName(notes[0])}`} tooltip={`Open ${displayName(notes[0])}`} onClick={() => onOpen(notes[0])}>
        <ArrowSquareOut />
      </Button>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost-quiet" size="icon-md" aria-label={`Used in ${plural(notes.length, 'note')}`} tooltip={`Used in ${plural(notes.length, 'note')}`}>
          <ArrowSquareOut />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {notes.map(path => <DropdownMenuItem key={path} onSelect={() => onOpen(path)}><FileIcon path={path} /> {displayName(path)}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
