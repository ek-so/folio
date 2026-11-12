import { useMemo, useRef } from 'react'
import PageLayout from './PageLayout.jsx'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import { EmptyMessage } from './EmptyState.jsx'
import { graphData } from '../lib/graph.js'
import { useGraphCanvas } from '../hooks/useGraphCanvas.js'

// Graph: every file and folder as a dot (notes in the accent, other files grey, folders outlined, the repo's root the
// largest), joined to its folder by a solid line, and linked files by a dotted one (lib/graph.js). The canvas fills the
// page (useGraphCanvas): drag, pan, zoom; a tap opens a file or folder in Graph's trail. `files`: the repo's files,
// `backlinks`: the link index's
export default function GraphPage({ page, files, backlinks, repoName, onOpenFile, onOpenFolder }) {
  const data = useMemo(() => graphData(files, backlinks, repoName), [files, backlinks, repoName])
  const canvas = useRef(null)
  useGraphCanvas(canvas, data, node => node.kind === 'folder' || node.kind === 'root' ? onOpenFolder(node.id) : onOpenFile(node.id))
  return (
    <PageLayout>
      <Surface title={<TitleBar page={page} />} full>
        <div className="relative flex min-h-0 flex-1">
          <canvas ref={canvas} aria-label="Graph of the repo's files and folders" className="min-h-0 w-full flex-1" />
          {data.nodes.length <= 1 && <EmptyMessage size="lg" className="absolute inset-x-0 top-0">No files yet.</EmptyMessage>}
        </div>
      </Surface>
    </PageLayout>
  )
}
