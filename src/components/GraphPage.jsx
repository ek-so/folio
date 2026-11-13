import { useMemo, useRef, useState } from 'react'
import { X, TreeView } from '@phosphor-icons/react'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import FileIcon from './FileIcon.jsx'
import PropertyBadges from './PropertyBadges.jsx'
import { Button } from './ui/button.jsx'
import { Popover, PopoverAnchor, PopoverContent } from './ui/popover.jsx'
import { EmptyMessage } from './EmptyState.jsx'
import { useSingleOpen } from '../hooks/useSingleOpen.jsx'
import { graphData } from '../lib/graph.js'
import { itemsIn } from '../lib/files.js'
import { frontMatter, noteTitle } from '../lib/frontmatter.js'
import { plural } from '../lib/plural.js'
import { useGraphCanvas } from '../hooks/useGraphCanvas.js'

// Graph: every file and folder as a dot (notes in the accent, other files grey, folders outlined, the repo's root the
// largest), joined to its folder by a solid line, and linked files by a dotted one (lib/graph.js). The canvas fills the
// page (useGraphCanvas): drag, pan, zoom; Tab goes through its dots (a hidden list of buttons). A tap on a dot opens a popover beside it (`DotInfo`); only its Open opens the file
// or folder, in Graph's trail. `files`: the repo's files; `backlinks`: the link index's; `notes`: the notes' texts on
// this device ({ path: text })
export default function GraphPage({ page, files, backlinks, notes, repoName, onOpenFile, onOpenFolder }) {
  const data = useMemo(() => graphData(files, backlinks, repoName), [files, backlinks, repoName])
  const canvas = useRef(null)
  const [open, setOpen] = useSingleOpen()
  const [picked, setPicked] = useState(null) // { node, at: { x, y }, keyboard }: the tapped dot and where, in the canvas
  const pick = (node, at, keyboard = false) => { setPicked({ node, at, keyboard }); setOpen(true) }
  const graph = useGraphCanvas(canvas, data, pick)
  const openPicked = () => {
    setOpen(false)
    const { node } = picked
    if (node.kind === 'folder' || node.kind === 'root') onOpenFolder(node.id)
    else onOpenFile(node.id)
  }
  return (
    <PageLayout>
      <Surface title={<TitleBar page={page} />} full>
        <div className="relative flex min-h-0 flex-1">
          <canvas ref={canvas} aria-hidden className="min-h-0 w-full flex-1" />
          {/* The dots for the keyboard and screen readers: a button each, out of sight; focusing one brings its dot out,
              Enter opens its popover, with the focus in it */}
          <ul aria-label="Files and folders in the graph" className="sr-only">
            {data.nodes.map(node => (
              <li key={node.id}>
                <button
                  type="button"
                  onFocus={() => graph.highlight(node.id)} onBlur={() => graph.highlight(null)}
                  onClick={() => pick(node, graph.pointOf(node.id), true)}
                >{node.name}</button>
              </li>
            ))}
          </ul>
          {data.nodes.length <= 1 && <EmptyMessage size="lg" className="absolute inset-x-0 top-0">No files yet.</EmptyMessage>}
          {picked && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverAnchor className="pointer-events-none absolute size-0" style={{ left: picked.at.x, top: picked.at.y }} />
              <PopoverContent side="right" align="start" sideOffset={12} className="w-72" onOpenAutoFocus={e => { if (!picked.keyboard) e.preventDefault() }}>
                <DotInfo node={picked.node} data={data} files={files} text={notes[picked.node.id]} onOpen={openPicked} onClose={() => setOpen(false)} />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </Surface>
    </PageLayout>
  )
}

// What a tapped dot is: its icon and name (a note's title) with a ✕ that closes the popover, the path to it (a folder:
// how many items are right inside it), a note's properties and description as on a widget's card (PropertyBadges,
// `text`: its text, when it's on this device), then Open
function DotInfo({ node, data, files, text, onOpen, onClose }) {
  const dir = node.kind === 'folder' || node.kind === 'root'
  const props = text === undefined ? [] : frontMatter(text)?.props ?? []
  const count = dir && itemsIn(node.id, data.nodes.filter(n => n.kind === 'note' || n.kind === 'file').map(n => n.id), data.nodes.filter(n => n.kind === 'folder').map(n => n.id))
  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex items-center gap-space-sm">
        <FileIcon path={node.id} dir={dir} />
        <span className="min-w-0 flex-1 break-words font-medium">{text === undefined ? node.name : noteTitle(text, node.name)}</span>
        <Button variant="ghost" size="icon" aria-label="Close" className="-my-space-xs -mr-space-xs text-muted-foreground" onClick={onClose}><X /></Button>
      </div>
      {node.id && <p className="flex items-start gap-space-xs break-all text-xs text-muted-foreground"><TreeView aria-hidden className="size-4 shrink-0" /><span className="min-w-0">{node.id}</span></p>}
      {dir && <p className="text-sm text-muted-foreground">{plural(count, 'item')}</p>}
      {props.length > 0 && <PropertyBadges props={props} path={node.id} files={files} />}
      <Button className="w-full" onClick={onOpen}>Open</Button>
    </div>
  )
}
