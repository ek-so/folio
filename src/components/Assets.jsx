import { useState } from 'react'
import { Images, ArrowSquareOut, Funnel, Check } from '@phosphor-icons/react'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import PageLayout from './PageLayout.jsx'
import FileIcon from './FileIcon.jsx'
import { ListRow, SELECTED } from './ui/list-row.jsx'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu.jsx'
import { PAGE } from '../lib/pages.js'
import { assetList, assetTypes, filterAssets } from '../lib/assets.js'
import { plural } from '../lib/plural.js'
import ItemMenu from './ItemMenu.jsx'
import { displayName, fileKind } from '../lib/files.js'
import { fileItem } from '../lib/folderNotes.js'

// Page listing every file in the repo that isn't a note (images, PDFs, uploads: lib/assets.js), newest added first, each
// as a row (ListRow): its name and under it its path; a row opens the file. On the right, a button opens the note that
// uses it (`backlinks`, the link index's: the notes that link to it): one opens at once, several list in a menu, none
// shows no button, then the file's ⋯ (`ItemMenu`, with Show in folder).
// The title bar's filter (`TypeFilter`) narrows the list to one file type (its extension), kept while the page is open.
export default function Assets({ files, added, backlinks, onOpen }) {
  const all = assetList(Object.keys(files), added)
  const types = assetTypes(all)
  const [picked, setType] = useState(null)
  const type = types.some(([t]) => t === picked) ? picked : null // a type whose last file is gone shows them all
  const paths = filterAssets(all, type)
  return (
    <PageLayout>
      <Surface title={<TitleBar page={PAGE.ASSETS}>{types.length > 1 && <TypeFilter types={types} total={all.length} type={type} onPick={setType} />}</TitleBar>}>
        <div className="flex-1 min-h-0 overflow-y-auto" data-no-pull>
          {paths.length === 0 ? (
            <div className="flex flex-col items-center gap-space-sm py-12 text-muted-foreground">
              <Images className="size-8" />
              <p className="text-sm">No files yet. Images, PDFs and other uploads show here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-space-sm p-space">
              <p className="px-3 text-sm text-muted-foreground">{type === null ? plural(all.length, 'file') : `${paths.length} of ${plural(all.length, 'file')}`}</p>
              <ul className="flex flex-col gap-0.5">
                {paths.map(path => (
                  <li key={path}>
                    <ListRow icon={<FileIcon path={path} />} title={path.split('/').pop()} description={path} onClick={() => onOpen(path)} disabled={fileKind(path) === 'file'} trailing={<>
                      <UsedIn notes={[...new Set((backlinks[path] ?? []).map(l => l.from))]} onOpen={onOpen} />
                      <ItemMenu item={fileItem(path)} reveal inList hoverReveal />
                    </>} />
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

// The title bar's file type filter: a button that lists the types in the repo's assets with their counts, All first (`types`:
// [[extension, count]], `type` the chosen one or null); lit while a type is chosen
function TypeFilter({ types, total, type, onPick }) {
  const row = (value, label, count) => (
    <DropdownMenuItem key={String(value)} onSelect={() => onPick(value)}>
      {type === value ? <Check /> : <span className="size-4" />} <span className="flex-1">{label}</span> <span className="text-muted-foreground">{count}</span>
    </DropdownMenuItem>
  )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost-outline" size="icon" aria-label="Filter by file type" tooltip="Filter by file type" className={type !== null ? SELECTED : undefined}>
          <Funnel />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
        {row(null, 'All types', total)}
        <DropdownMenuSeparator />
        {types.map(([t, count]) => row(t, t ? `.${t}` : 'No extension', count))}
      </DropdownMenuContent>
    </DropdownMenu>
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
